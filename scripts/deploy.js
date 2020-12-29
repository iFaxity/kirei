#!/usr/bin/env node

// Runs semantic release in every package
const { execSync } = require('child_process');
const { resolve } = require('path');
const { resolvePackages } = require('./roll');

const PACKAGES_ROOT = resolve(__dirname, '../packages');
const COMMAND = `npx semantic-release -d`;

function main() {
  const packages = resolvePackages(PACKAGES_ROOT, false);

  for (const pkg of packages.values()) {
    const { dir, package } = pkg;

    console.log(dir);
    console.log(`Deploying ${package.name}`);

    try {
      execSync(COMMAND, {
        cwd: dir,
        stdio: 'inherit'
      });
    } catch (ex) {
      process.exit(1);
    }
  }
}

main();
