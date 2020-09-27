const outputConfigs = {
  esm: {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: 'es',
  },
  'esm-browser': {
    file: resolve(`dist/${name}.esm-browser.js`),
    format: 'es',
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: 'cjs',
  },
  browser: {
    file: resolve(`dist/${name}.global.js`),
    format: 'iife',
  }
};

const DEFAULT_CONF = {
  prod: false, // add production ENV and .prod.js
  minify: true, // use terser to mangle content
  bundle: false, // if external modules should be bundled
  format: null, // iife, cjs, esm,
};

exports.createConfigs = function createConfigs(configs) {
  return Object.keys(configs).reduce((acc, key) => {
    const config = { ...DEFAULT_CONF, ...configs[key] };

    acc[key] = createConfig(config);
    return acc;
  }, {});
};

exports.createProductionConfig = function createProductionConfig(format) {
  return createConfig(format, {
    file: resolve(`dist/${name}.${format}.prod.js`),
    format: outputConfigs[format].format
  });
};

exports.createMinifiedConfig = function createMinifiedConfig(format) {
  const { terser } = require('rollup-plugin-terser');
  return createConfig(
    format, {
      file: outputConfigs[format].file.replace(/\.js$/, '.prod.js'),
      format: outputConfigs[format].format,
    }, [
      terser({
        module: /^esm/.test(format),
        compress: {
          ecma: 2015,
          pure_getters: true,
        },
      }),
    ],
  );
};

// ensure TS checks only once for each build
let shouldEmitDeclarations = false;
const packageOptions = pkg.buildOptions || {};

// make CWD agnostic, please
// run configs 
exports.createConfig = function createConfig(format, output) {
  if (!output) {
    console.error(`invalid format: "${format}"`);
    process.exit(1);
  }

  output.sourcemap = !!process.env.SOURCE_MAP;
  output.externalLiveBindings = false;

  const isProductionBuild = process.env.__DEV__ === 'false' || /\.prod\.js$/.test(output.file);
  const isBundlerESMBuild = /esm-bundler/.test(format);
  const isBrowserESMBuild = /esm-browser/.test(format);
  const isNodeBuild = format === 'cjs';
  const isGlobalBuild = /global/.test(format);

  if (isGlobalBuild) {
    output.name = packageOptions.name;
  }

  const tsPlugin = ts({
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    sourceMap: output.sourcemap,
    declaration: shouldEmitDeclarations,
    declarationMap: shouldEmitDeclarations,
  });

  // we only need to check TS and generate declarations once for each build.
  // it also seems to run into weird issues when checking multiple times
  // during a single build.
  shouldEmitDeclarations = false;

  const external =
    isGlobalBuild || isBrowserESMBuild
      ? packageOptions.enableNonBrowserBranches
        ? // externalize postcss for @vue/compiler-sfc
          // because @rollup/plugin-commonjs cannot bundle it properly
          ['postcss']
        : // normal browser builds - non-browser only imports are tree-shaken,
          // they are only listed here to suppress warnings.
          ['source-map', '@babel/parser', 'estree-walker']
      : // Node / esm-bundler builds. Externalize everything.
        [
          ...Object.keys(pkg.dependencies || {}),
          ...Object.keys(pkg.peerDependencies || {}),
        ];

  const nodePlugins =
    packageOptions.enableNonBrowserBranches && format !== 'cjs'
      ? [
          require('@rollup/plugin-node-resolve').nodeResolve(),
          require('@rollup/plugin-commonjs')({
            sourceMap: false
          })
        ]
      : [];

  return {
    input: resolve(entryFile),
    // Global and Browser ESM builds inlines everything so that they can be
    // used alone.
    external,
    plugins: [
      tsPlugin,
      createReplacePlugin(
        isProductionBuild,
        isBundlerESMBuild,
        isBrowserESMBuild,
        // isBrowserBuild?
        (isGlobalBuild || isBrowserESMBuild || isBundlerESMBuild) &&
          !packageOptions.enableNonBrowserBranches,
        isGlobalBuild,
        isNodeBuild
      ),
      ...nodePlugins,
      ...plugins
    ],
    output,
    onwarn: (msg, warn) => {
      if (!/Circular/.test(msg)) {
        warn(msg);
      }
    },
    treeshake: {
      moduleSideEffects: false,
    },
  };
};
