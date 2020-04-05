// yarn publish all packages with same version
// create a git commit and tag it
const { promisify } = require('util');
const fs = require('fs');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const writeFile = promisify(fs.writeFile);
const { exec } = require('child_process');
const path = require('path');

const ROOT_DIR = __dirname;
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const pkg = require('./package.json');
const semver = [ 'major', 'minor', 'patch' ];

function shell(cmd, package) {
  const cwd = package ? path.join(PACKAGES_DIR, package) : ROOT_DIR;

  return new Promise((resolve, reject) => {
    exec(cmd, { cwd, encoding: 'utf-8' }, ex => ex ? reject(ex) : resolve());
  });
}

function bumpVersion(tag) {
  const idx = semver.indexOf(tag);
  const version = pkg.version.split('.');

  if (idx == -1) {
    throw new Error('');
  }

  version[idx] = String((Number(version[idx]) + 1));
  return version.join('.');
}

async function main() {
  const tag = process.argv[3];
  const version = bumpVersion(tag);
  const packages = await readdir(PACKAGES_DIR);

  // Do yarn publish on all packages individually
  // THis assumes prepublish script hook for rebuilding the typescript sources
  console.log('Publishing package');
  for (const package of packages) {
    const dir = path.join(PACKAGES_DIR, dir);
    const stats = await stat(dir);

    if (stats.isDirectory()) {
      await shell(`yarn publish --new-version ${version} --no-git-tag-version --access=public`, package);
    }
  }

  // Update version in root package
  pkg.version = version;
  await writeFile(path.join(ROOT_DIR, 'package.json'), JSON.stringify(pkg), 'utf8');

  // Create a commit with a release tag
  console.log('Creating commit');
  await shell(`git commit -m v${version}`);
  await shell(`git tag -a v${version} -m v${version}`);
}

main.catch(console.error);

