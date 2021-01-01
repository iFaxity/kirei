#!/usr/bin/env node

/*
Runs semantic-release in every package in a specific order to bump dependencies of linked packages before publishing
Ensures that all the packages runs the latest compatible version of a linked package
*/
const { execSync } = require('child_process');
const { resolve } = require('path');
const { resolvePackages } = require('./roll');

const { dryRun } = require('yargs')
  .option('dryRun', {
    type: 'boolean',
    alias: 'd',
    default: false,
    description: 'Runs script without commiting any permament changes',
  })
  .help('help').alias('h', 'help').argv;

const PACKAGES_ROOT = resolve(__dirname, '../packages');
const COMMAND = `npx semantic-release ${process.argv.slice(2).join(' ')}`;

// Manually for now.
// before every deploy cehck next package version of dependent packages, and extract the new version
const PACKAGE_ORDER = [
  '@kirei/shared',
  '@kirei/html',
  '@kirei/element',
  '@kirei/hmr-api',
  '@kirei/router',
  '@kirei/store',
  'babel-plugin-kirei',
  '@kirei/vite-plugin',
];
const PACKAGE_DEP_KEYS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
];

function bumpVersions(dir, package) {
  const updatedPackages = []

  // as pacakges get updated we need to re fetch before we bump versions
  const packages = resolvePackages(PACKAGES_ROOT, true);
  packages.delete(package.name); // no circual checking

  // if package requires peer package from monorepo, update to latest version
  PACKAGE_DEP_KEYS.forEach(key => {
    const deps = package[key];
    if (deps == null || typeof deps != 'object') {
      return;
    }

    for (const [ packageName, meta ] of packages) {
      if (deps[packageName]) {
        deps[packageName] = `^${meta.package.version}`;
        updatedPackages.push({ name: packageName, version: deps[packageName] });
      }
    }
  });

  if (updatedPackages.length) {
    console.log(`Bumped dependencies: ${package.name}:`);
    // Pretty print json
    console.dir(updatedPackages, { breakLength: 1 });

    if (!dryRun) {
      writePackage(dir, package);
    }
  }
}

// Runs semantic release in every package to publish versions
function main() {
  const packages = resolvePackages(PACKAGES_ROOT, false);

  if (dryRun) {
    console.log('Dry run activated, no changes will be commited.');
  }

  PACKAGE_ORDER
    .filter(key => packages.has(key))
    .forEach(key => {
      const { dir, package } = packages.get(key);

      console.log(`Deploying ${package.name}`);

      try {
        bumpVersions(dir, package);

        if (!dryRun) {
          execSync(COMMAND, { cwd: dir, stdio: 'inherit' });
        }
        console.log();
      } catch (ex) {
        console.error(ex);
        process.exit(1);
      }
    });
}

main();
