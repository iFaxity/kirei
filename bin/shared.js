#!/usr/bin/env node
//
// Script to synchronize publishing for all packages
//
const { readdirSync, readFileSync, writeFileSync, statSync } = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../');

// json file operations
function readJSON(filepath) {
  const data = readFileSync(filepath, 'utf8');
  return JSON.parse(data);
}

function writeJSON(filepath, data) {
  const json = JSON.stringify(data, null, 2);
  writeFileSync(filepath, json, 'utf8');
}

// Executes a shell command
function shell(cmd, path) {
  let cwd = ROOT_DIR;
  if (path) {
    cwd += `/${path}`;
  }

  return execSync(cmd, { cwd, encoding: 'utf8' });
}

function resolvePackages(rootDir, fuzzy) {
  const packages = readdirSync(rootDir);

  // filter packages by name

  return packages.reduce((acc, name) => {
    const dir = path.resolve(rootDir, name);
    const stats = statSync(dir);

    // Only publish directories with package.json set to public
    if (stats.isDirectory()) {
      const package = readJSON(path.resolve(dir, 'package.json'));

      if (package.private !== true) {
        acc.set(package.name, { package, dir });
      }
    }

    return acc;
  }, new Map());
}

exports.readJSON = readJSON;
exports.writeJSON = writeJSON;
exports.shell = shell;
exports.resolvePackages = resolvePackages;
