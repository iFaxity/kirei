const path = require('path');
const { terser } = require('rollup-plugin-terser');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const typescript = require('rollup-plugin-typescript2');
const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const { rollup } = require('rollup');

const ENTRYPOINT = 'src/index.ts';

// shorthand configs
/*const DEFAULT_CONF = {
  prod: true, // builds prod too, .prod.js, also minify
  bundler: false, // if external modules should be bundled
  format: null, // iife, cjs, esm
};*/
const CONFIGS = {
  cjs: {
    prod: true,
    bundler: false,
    format: 'cjs',
  },
  esm: {
    prod: false,
    bundler: false,
    format: 'esm',
  },
  global: {
    prod: true,
    bundler: true,
    format: 'iife',
  },
  'esm-browser': {
    prod: true,
    bundler: true,
    format: 'esm',
  },
};

// make CWD agnostic, please
/* run configs 
function createConfig(pkg, pkgName, config) {
  // generate output name.
  /* generate all other options based on config input.
  if (!output) {
    console.error(`invalid format: "${format}"`);
    process.exit(1);
  }*
  const { prod, bundler, format } = config;
  const isProdBuild = !!prod;
  const isNodeBuild = format === 'cjs';
  const isGlobalBuild = format === 'iife';
  const isESM = format === 'esm';
  const filename = pkg.name.includes('@') ? pkg.name.split('@', 2)[1] : pkg.name;

  // only emit declarations on default build
  const shouldEmit = (isESM && !prod && !bundle);
  let extname = '.js';
  const output = {
    //filename: `${name}`, set later
    // external, set later
    sourcemap: isProdBuild,
    externalLiveBindings: false,
    plugins: [
      typescript({
        tsconfig: path.resolve(__dirname, '../tsconfig.json'),
        sourceMap: output.sourcemap,
        declaration: shouldEmit,
        declarationMap: shouldEmit,
      }),
      replace({
        __DEV__: isBundler ? '(process.env.NODE_ENV !== \'production\')' : String(!isProdBuild),
        __BROWSER__: String(!isNodeBuild),
        __NODE_JS__: String(isNodeBuild),
        __VERSION__: pkg.version,
      }),
    ],
    output,
  };

  if (isProdBuild) {
    const minifyer = terser({
      module: isESM,
      compress: {
        ecma: 2015,
        pure_getters: true,
      },
    });

    output.plugins.push(minifyer);
    extname = `.prod${extname}`;
  }

  if (isGlobalBuild) {
    extname = `.global${extname}`;
    output.name = pkgName;
  }

  if (isNodeBuild || bundler) {
    // Node / esm-bundler builds. Externalize dependencies.
    output.extenal = [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ];
  }

  // Resolve external modules if not node build
  if (!isNodeBuild) {
    output.plugins.push(nodeResolve());
    output.plugins.push(commonjs({ sourceMap: false }));
  }

  // Return output only
  output.filename = `${filename}${extname}`;
  return output;

  /*return {
    // Global and Browser ESM builds inlines everything so that they can be
    // used alone.
    external,
    plugins: [
      typescript({
        tsconfig: path.resolve(__dirname, '../tsconfig.json'),
        sourceMap: output.sourcemap,
        declaration: shouldEmit,
        declarationMap: shouldEmit,
      }),
      replace({
        __DEV__: isBundler ? '(process.env.NODE_ENV !== \'production\')' : String(!isProdBuild),
        __BROWSER__: String(!isNodeBuild),
        __NODE_JS__: String(isNodeBuild),
        __VERSION__: pkg.version,
      }),
      ...plugins
    ],
    output,
  };*
}*/

function createConfig({ name: bundleName, dir, package, config }, tsCheck) {
  // generate output name.
  /* generate all other options based on config input.
  if (!output) {
    console.error(`invalid format: "${format}"`);
    process.exit(1);
  }*/
  const pkgName = package.name;
  const { prod, bundler: isBundled, format } = config;

  const isProdBuild = !!prod;
  const isNodeBuild = format === 'cjs';
  const isGlobalBuild = isBundled;
  const isESM = format === 'esm';
  const filename = pkgName.includes('@') ? pkgName.split('/', 2)[1] : pkgName;

  let extname = '.js';
  let prePlugins = [];
  let postPlugins = [];
  let external = [];
  let name;

  // Resolve external modules if not node build
  if (!isNodeBuild) {
    prePlugins.push(nodeResolve({ preferBuiltins: true }), commonjs({ sourceMap: false }));
  } else {
    extname = `.cjs${extname}`;
    external = [
      ...Object.keys(package.dependencies || {}),
      ...Object.keys(package.peerDependencies || {}),
    ];
  }

  if (isProdBuild) {
    const minifyer = terser({
      module: isESM,
      compress: {
        ecma: 2015,
        pure_getters: true,
      },
    });

    postPlugins.push(minifyer);
    extname = `.prod${extname}`;
  }

  if (isGlobalBuild) {
    extname = `.global${extname}`;
    name = bundleName;
  } else if (isESM) {
    extname = `.esm${extname}`;
  }

  /*if (!isGlobalBuild) {
    external = [
      ...Object.keys(package.dependencies || {}),
      ...Object.keys(package.peerDependencies || {}),
    ];
  }*/

  // Return rollup config
  return {
    input: {
      external,
      input: path.resolve(dir, ENTRYPOINT),
      plugins: [
        ...prePlugins,
        json(),
        typescript({
          check: isProdBuild && tsCheck,
          tsconfig: path.resolve(__dirname, '../tsconfig.json'),
          cacheRoot: path.resolve(__dirname, '../node_modules/.rts2_cache'),
          tsconfigOverride: {
            compilerOptions: {
              sourceMap: isProdBuild,
              declaration: tsCheck,
              declarationMap: tsCheck,
            }
          }
        }),
        replace({
          __DEV__: isBundled ? '(process.env.NODE_ENV !== \'production\')' : String(!isProdBuild),
          __BROWSER__: String(!isNodeBuild),
          __NODE_JS__: String(isNodeBuild),
          __VERSION__: package.version,
        }),
        ...postPlugins,
      ],
      treeshake: {
        moduleSideEffects: false,
      },
      onwarn: (msg, warn) => !/Circular/.test(msg) && warn(msg),
    },
    output: {
      name,
      format,
      //dir: path.resolve(dir, 'dist/'),
      file: path.resolve(dir, `dist/${filename}${extname}`),
      // external, set later
      sourcemap: isProdBuild,
      externalLiveBindings: false,
    },
  }
}

exports.rollPackage = function rollPackage(target, skipProd = false) {
  const { dir, package } = target;
  const { name, configs } = package.build;
  /*{
    "build": [
      name: "VueReactive",
      configs: [ 'cjs', 'browser', 'esm', 'esm-browser' ],
    ]
  }*/

  const buildConfigs = configs.reduce((acc, key) => {
    const config = { ...CONFIGS[key] };

    if (config.prod) {
      if (skipProd) {
        config.prod = false;
      } else {
        const devConfig = { ...config, prod: false };
        acc.push(createConfig({ name, dir, package, config: devConfig }, !acc.length));
      }
    }

    acc.push(createConfig({ name, dir, package, config }, !acc.length));
    return acc;
  }, []);

  const promises = buildConfigs.map(config => {
    return rollup(config.input).then(bundle => bundle.write(config.output));
  });

  return Promise.all(promises);
};
