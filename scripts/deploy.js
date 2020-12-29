#!/usr/bin/env node

const { execSync } = require('child_process');
const { resolve } = require('path');
const { resolvePackages } = require('./roll');

// Runs semantic release in every package to publish versions
function main() {
  const PACKAGES_ROOT = resolve(__dirname, '../packages');
  const COMMAND = `npx semantic-release ${process.argv.slice(2).join(' ')}`;

  const packages = resolvePackages(PACKAGES_ROOT, false);

  for (const pkg of packages.values()) {
    const { dir, package } = pkg;

    console.log(dir);
    console.log(`Deploying ${package.name}`);

    try {
      execSync(COMMAND, {
        cwd: dir,
        stdio: 'inherit',
        env: process.env,
      });
    } catch (ex) {
      process.exit(1);
    }
  }
}

main();
