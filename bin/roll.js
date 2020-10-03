const path = require('path');
const { terser } = require('rollup-plugin-terser');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const typescript = require('@rollup/plugin-typescript');
const commonjs = require('@rollup/plugin-commonjs');
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

function createRollConfig(target) {
  // generate output name.
  /* generate all other options based on config input.
  if (!output) {
    console.error(`invalid format: "${format}"`);
    process.exit(1);
  }*/
  const { prod, bundler, format } = config;
  const isProdBuild = !!prod;
  const isNodeBuild = format === 'cjs';
  const isGlobalBuild = format === 'iife';
  const isESM = format === 'esm';
  const filename = pkg.name.includes('@') ? pkg.name.split('@', 2)[1] : pkg.name;
  // only emit once, on default builds
  const shouldEmit = (isESM && !prod && !bundle);

  let extname = '.js';
  let plugins = [];
  let external;
  let name;

  if (isProdBuild) {
    const minifyer = terser({
      module: isESM,
      compress: {
        ecma: 2015,
        pure_getters: true,
      },
    });

    plugins.push(minifyer);
    extname = `.prod${extname}`;
  }

  // Resolve external modules if not node build
  if (!isNodeBuild) {
    plugins.push(nodeResolve(), commonjs({ sourceMap: false }));
  }

  if (isGlobalBuild) {
    extname = `.global${extname}`;
    name = pkgName;
  }

  if (isNodeBuild || bundler) {
    // Node / esm-bundler builds. Externalize all dependencies.
    external = [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ];
  }

  // Return rollup config
  return {
    input: {
      external,
      input: path.resolve(dir, 'dist/', ENTRYPOINT),
      plugins: [
        typescript({
          tsconfig: path.resolve(__dirname, '../tsconfig.json'),
          sourceMap: output.sourcemap,
          declaration: shouldEmit,
          declarationMap: shouldEmit,
          declarationDir: './lib',
        }),
        replace({
          __DEV__: isBundler ? '(process.env.NODE_ENV !== \'production\')' : String(!isProdBuild),
          __BROWSER__: String(!isNodeBuild),
          __NODE_JS__: String(isNodeBuild),
          __VERSION__: pkg.version,
        }),
        ...plugins,
      ],
      treeshake: {
        moduleSideEffects: false,
      },
      onwarn: (msg, warn) => !/Circular/.test(msg) && warn(msg),
    },
    output: {
      name, dir,
      filename: `${filename}${extname}`,
      // external, set later
      sourcemap: isProdBuild,
      externalLiveBindings: false,
    },
  }
}

// map multiple configs in a package into one rollup config
// maybe only send package, load configs from key
function createOutputsFromPackage(pkg, skipProd) {
  const build = pkg.build;
  /*{
    "build": [
      name: "VueReactive",
      configs: [ 'cjs', 'browser', 'esm', 'esm-browser' ],
    ]
  }*/

  return build.configs.reduce((acc, key) => {
    const config = { ...CONFIGS[key] };

    if (config.prod) {
      if (skipProd) {
        config.prod = false;
      } else {
        acc.push(createConfig(pkg, build.name, { ...config, prod: false }));
      }
    }

    acc.push(createConfig(pkg, build.name, config));
    return acc;
  }, []);
}

// make CWD agnostic, please
// run configs 
function createConfig(pkg, pkgName, config) {
  // generate output name.
  /* generate all other options based on config input.
  if (!output) {
    console.error(`invalid format: "${format}"`);
    process.exit(1);
  }*/
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
  };*/
}

function createConfig() {

}

exports.rollPackage = function rollPackage(target) {
  const { dir, package } = target;
  const { name, configs } = package.build;
  /*{
    "build": [
      name: "VueReactive",
      configs: [ 'cjs', 'browser', 'esm', 'esm-browser' ],
    ]
  }*/

  const buildConfigs = build.configs.reduce((acc, key) => {
    const config = { ...CONFIGS[key] };

    if (config.prod) {
      if (skipProd) {
        config.prod = false;
      } else {
        acc.push(createConfig(pkg, build.name, { ...config, prod: false }));
      }
    }

    acc.push(createConfig(pkg, build.name, config));
    return acc;
  }, []);

  for (const config of buildConfigs) {

  }


  const input = createInput(dir);
  const bundle = await rollup(input);
  const outputs = createOutputs(package);

  for (const output of outputs) {
    output.dir = path.resolve(dir, 'dist/');
    await bundle.write(output);
  }
};
