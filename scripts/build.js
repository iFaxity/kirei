#!/usr/bin/env node

/*
Produces production builds and stitches together d.ts files.
To specify the package to build, simply pass its name and the desired build
formats to output (defaults to `buildOptions.formats` specified in that package,
or "esm,cjs"):
```
# name supports fuzzy match. will build all packages with name containing "dom":
yarn build dom
# specify the format to output
yarn build core --formats cjs
*/
const { resolve } = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const { readFile, writeFile, access, rmdir, rm } = require('fs/promises');
const gzip = promisify(zlib.gzip);
const brotli = promisify(zlib.brotliCompress);
const { rollPackage, resolvePackages } = require('./roll');
const PACKAGES_ROOT = resolve(__dirname, '../packages');

const args = require('yargs')
  .option('types', {
    type: 'boolean',
    alias: 't',
    default: false,
    description: 'Generate type declarations after build',
  })
  .option('release', {
    type: 'boolean',
    alias: 'r',
    default: false,
    description: 'Builds for release with types, ignores any private packages',
  })
  .option('formats', {
    type: 'array',
    alias: 'f',
    choices: [ 'cjs', 'esm', 'global', 'module' ],
    default: [],
    description: 'Formats to solely build targeted types',
  })
  .option('setVersion', {
    type: 'string',
    alias: 's',
    default: '0.0.0',
    description: 'Version to explicity set in the build, intended for CI',
  })
  // Special config
  .help('help').alias('h', 'help').argv;

const isRelease = args.release;
const buildTypes = isRelease || args.types;
const formats = args.formats.length ? args.formats : null;
const targets = args._.length ? args._ : null;
const version = args.setVersion;

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function rmrf(path) {
  if (rm) {
    return rm(path, { recursive: true, force: true });
  }

  return rmdir(path, { recursive: true });
}

async function checkSize(dir, name) {
  const filename = name.includes('/') ? name.split('/', 2)[1] : name;
  const filePath = resolve(dir, `dist/${filename}.global.prod.cjs`);

  if (await exists(filePath)) {
    const file = await readFile(filePath);
    const gzipped = await gzip(file);
    const brotlied = await brotli(file);

    return [ file.length, gzipped.length, brotlied.length ];
  }
}

async function build(target, opts, packages) {
  const { dir, package } = target;

  // if building a specific format, do not remove dist.
  if (!formats) {
    await rmrf(`${dir}/dist`);
  }

  // Build package, with package execution time
  const start = Date.now();
  let completed = true;
  try {
    console.log(`\u001B[36;1mBuilding: ${package.name}\u001B[0m`);
    await rollPackage(target, opts, packages);
  } catch (ex) {
    console.error(String(ex));
    process.exitCode = 1;
    completed = false;
  } finally {
    const diff = (Date.now() - start) / 1000;
    const status = completed ? 'completed' : 'errored';
    const color = completed ? '\u001B[32;1m' : '\u001B[31;1m';
    console.log(`${color}Build ${status} after ${diff.toFixed(2)}s\u001B[0m`);
  }

  // Not currently working with import/export type
  if (completed && buildTypes && package.types) {
    await rmrf(`${dir}/${package.types}`);

    const { generateDtsBundle } = require('dts-bundle-generator');
    console.log(`\u001B[36;1mGenerating type declaration\u001B[0m`);

    const start = Date.now();

    // list all .ts files
    try {
      const entries = [
        { filePath: resolve(PACKAGES_ROOT, 'globals.d.ts') },
        {
          filePath: resolve(dir, 'src/index.ts'),
          output: {
            inlineDeclareExternals: true,
            noBanner: true,
          },
        },
      ];

      const output = generateDtsBundle(entries, {
        preferredConfigPath: resolve(__dirname, 'tsconfig.json'),
        followSymlinks: false,
      });

      await writeFile(resolve(dir, package.types), output.pop(), 'utf8');
      completed = true;
    } catch (ex) {
      console.error(String(ex));
      process.exitCode = 1;
      completed = false;
    }

    const diff = (Date.now() - start) / 1000;
    const status = completed ? 'completed' : 'errored';
    const color = completed ? '\u001B[32;1m' : '\u001B[31;1m';
    console.log(`${color}Generation ${status} after ${diff.toFixed(2)}s\u001B[0m`);
  }

  console.log('');
}

async function main() {
  const opts = { formats, version };
  const pkgs = resolvePackages(PACKAGES_ROOT, !isRelease, targets);

  if (pkgs.size) {
    for (const target of pkgs.values()) {
      try {
        await build(target, opts, pkgs);
      } catch (ex) {
        console.error(ex);
        process.exitCode = 1;
      }
    }
  
    // Interpolate numbers as kb of number
    // calculate sizes of the bundles
    const results = [];
    const size = (value) => `${(value / 1024).toFixed(1)}kb`;
  
    for (const target of pkgs.values()) {
      const pkgName = target.package.name;
      const res = await checkSize(target.dir, pkgName);
  
      if (res) {
        results.push(`${pkgName} production build: min: ${size(res[0])} / gzip: ${size(res[1])} / brotli: ${size(res[2])}`);
      }
    }
  
    if (results.length) {
      console.log(results.join('\n'));
    }
  } else {
    console.error('ERROR:No packages matched by filter!\n');
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
