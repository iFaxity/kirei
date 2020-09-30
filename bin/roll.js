const path = require('path');
const { terser } = require('rollup-plugin-terser');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const typescript = require('@rollup/plugin-typescript');
const commonjs = require('@rollup/plugin-commonjs');
const { rollup } = require('rollup');

// shorthand configs
/*const DEFAULT_CONF = {
  prod: true, // add production ENV and .prod.js, also minify and map
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

exports.createInput = function createInput(dir, input = 'src/index.ts') {
  return {
    input: path.join(dir, input),
    treeshake: {
      moduleSideEffects: false,
    },
    onwarn: (msg, warn) => !/Circular/.test(msg) && warn(msg),
  };
}

// map multiple configs in a package into one rollup config
// maybe only send package, load configs from key
exports.createOutputsFromPackage = function createConfigFromPackage(dir, pkg) {
  const build = pkg.build || {};
  /*{
    "build": [
      name: "VueReactive",
      configs: [ 'cjs', 'browser', 'esm', 'esm-browser' ],
    ]
  }*/

  return build.configs.reduce((acc, key) => {
    acc[key] = createConfig(pkg, build.configs[key]);
    return acc;
  }, {});
};

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
    //external, set later
    sourcemap: isProductionBuild,
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
    output.external.push(...Object.keys(pkg.dependencies || {}));
    output.external.push(...Object.keys(pkg.peerDependencies || {}));
  }

  // Resolve external modules if not node build
  if (!isNodeBuild) {
    output.plugins.push(nodeResolve());
    output.plugins.push(commonjs({ sourceMap: false }));
  }

  // Return output only
  output.filename = `dist/${filename}${extname}`;
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
};
