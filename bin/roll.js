const path = require('path');
const { terser } = require('rollup-plugin-terser');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const typescript = require('rollup-plugin-typescript2');
const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const { rollup } = require('rollup');
const { builtinModules } = require('module');

const ENTRYPOINT = 'src/index.ts';
const BUILTIN_MODULES = builtinModules.filter(x => !x.startsWith('_'));
const CONFIGS = {
  cjs: {
    prod: true,
    bundler: false,
    format: 'cjs',
    ext: 'cjs',
  },
  esm: {
    prod: false,
    bundler: false,
    format: 'esm',
    ext: 'esm',
  },
  global: {
    prod: true,
    bundler: true,
    format: 'iife',
    ext: 'global',
  },
  'esm-browser': {
    prod: true,
    bundler: true,
    format: 'esm',
    ext: 'bundled',
  },
};

function createConfig({ name, dir, package, config }, tsCheck) {
  const pkgName = package.name;
  const { prod, ext, bundler: isBundled, format } = config;

  const isProdBuild = !!prod;
  const isNodeBuild = format === 'cjs';
  const isGlobalBuild = isBundled;
  const isESM = format === 'esm';
  const filename = pkgName.includes('@') ? pkgName.split('/', 2)[1] : pkgName;

  let prePlugins = [];
  let postPlugins = [];
  let external = [ ...BUILTIN_MODULES ];

  // better way to do this?
  const extname = `.${ext}${isProdBuild ? '.prod' : ''}.js`;

  if (isProdBuild) {
    const minifyer = terser({
      module: isESM,
      compress: {
        ecma: 2015,
        pure_getters: true,
      },
    });

    postPlugins.push(minifyer);
  }

  // Resolve external modules if not node build
  if (!isNodeBuild) {
    prePlugins.push(nodeResolve({ preferBuiltins: true }), commonjs({ sourceMap: false }));
  }

  if (!isGlobalBuild) {
    external.push(...Object.keys(package.dependencies || {}));
    external.push(...Object.keys(package.peerDependencies || {}));
  }

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
          clean: true,
          //cacheRoot: path.resolve(__dirname, '../node_modules/.rts2_cache'),
          /*useTsconfigDeclarationDir: true,
          tsconfigOverride: {
            compilerOptions: {
              sourceMap: isProdBuild,
              declaration: tsCheck,
              declarationMap: tsCheck,
              declarationDir: path.resolve(dir, 'dist/lib'),
            },
          },*/
        }),
        replace({
          __DEV__: isBundled ? String(!isProdBuild) : '(process.env.NODE_ENV !== \'production\')',
          __BROWSER__: String(!isNodeBuild),
          __NODE_JS__: String(isNodeBuild),
          __VERSION__: package.version,
        }),
      ],
      /*treeshake: {
        moduleSideEffects: true,
      },*/
      onwarn: (msg, warn) => !/Circular/.test(msg) && warn(msg),
    },
    output: {
      name, format,
      plugins: postPlugins,
      exports: 'auto',
      file: path.resolve(dir, `dist/${filename}${extname}`),
      sourcemap: true, // isProdBuild,
      externalLiveBindings: false,
    },
  }
}

exports.rollPackage = async function rollPackage(target, skipProd = false) {
  const { dir, package } = target;
  const { name, configs } = package.build;
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
