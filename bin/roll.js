const path = require('path');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const replace = require('@rollup/plugin-replace');
const esbuild = require('rollup-plugin-esbuild');
const { rollup } = require('rollup');
const { builtinModules: BUILTIN_MODULES } = require('module');

const ENTRYPOINT = 'src/index.ts';
const CONFIGS = {
  // CJS for Node (.cjs.js)
  cjs: {
    prod: true,
    bundler: false,
    format: 'cjs',
  },
  // ESM for bundlers (.esm.js)
  esm: {
    prod: false,
    bundler: false,
    format: 'esm',
  },
  // browser build IIFE (.global.js)
  global: {
    prod: true,
    bundler: true,
    format: 'iife',
  },
  // bundled esm module (.mjs)
  module: {
    prod: true,
    bundler: true,
    format: 'esm',
  },
};

function createConfig(key, opts) {
  // Unpack options
  const { name, dir, package, config } = opts;
  const { prod, bundler: isBundled, format } = config;
  const pkgName = package.name;
  const isProdBuild = !!prod;
  const isNodeBuild = format === 'cjs';
  const FILENAME = pkgName.includes('@') ? pkgName.split('/', 2)[1] : pkgName;
  const external = [ ...BUILTIN_MODULES ];
  //const plugins = [];

  // better way to do this?
  // Module should end with .mjs
  const extname = key === 'module'
    ? `${isProdBuild ? '.prod' : ''}.mjs`
    : `.${key}${isProdBuild ? '.prod' : ''}.js`;

  // External modules should not be built
  if (!isBundled) {
    external.push(...Object.keys(package.dependencies || {}));
    external.push(...Object.keys(package.peerDependencies || {}));
  }

  // Return rollup config
  return {
    input: {
      external,
      input: path.resolve(dir, ENTRYPOINT),
      plugins: [
        nodeResolve({ preferBuiltins: true }),
        commonjs({ sourceMap: false }),
        // replace env vars for @vue/reactivity
        replace({
          "process.env.NODE_ENV": JSON.stringify(isProdBuild ? 'production' : 'development'),
        }),
        esbuild({
          tsconfig: path.resolve(__dirname, '../tsconfig.json'),
          sourceMap: false,
          minify: isProdBuild,
          define: {
            __DEV__: JSON.stringify(isBundled ? isProdBuild : '(process.env.NODE_ENV !== \'production\')'),
            __BROWSER__: JSON.stringify(!isNodeBuild),
            __NODE_JS__: JSON.stringify(isNodeBuild),
            __VERSION__: JSON.stringify(package.version),
          },
          // Extra loaders
          loaders: {
            // Add .json files support
            '.json': 'json',
          },
        }),
      ],
      /*treeshake: {
        moduleSideEffects: false,
      },*/
      onwarn: (msg, warn) => !/Circular/.test(msg) && warn(msg),
    },
    output: {
      name, format, //plugins,
      exports: 'auto',
      file: path.resolve(dir, `dist/${FILENAME}${extname}`),
      sourcemap: true,
      externalLiveBindings: false,
    },
  };
}

const skipProd = false;
exports.rollPackage = async function rollPackage(target, opts) {
  const { formats } = opts;
  const { dir, package } = target;
  let { name, configs } = package.build;

  if (formats) {
    configs = configs.filter(key => formats.includes(key));
  }

  //const skipProd = false;
  const buildConfigs = configs.reduce((acc, key) => {
    const config = { ...CONFIGS[key] };

    if (config.prod) {
      if (skipProd) {
        config.prod = false;
      } else {
        const devConfig = { ...config, prod: false };
        acc.push(createConfig(key, { name, dir, package, config: devConfig }, !acc.length));
      }
    }

    acc.push(createConfig(key, { name, dir, package, config }, !acc.length));
    return acc;
  }, []);

  const promises = buildConfigs.map(config => {
    return rollup(config.input).then(bundle => bundle.write(config.output));
  });

  return Promise.all(promises);
};
