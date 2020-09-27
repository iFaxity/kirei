#!/usr/bin/env node
//
// Script to synchronize publishing for all packages
//
const { readdirSync, readFileSync, writeFileSync, statSync } = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '../');

// json file operations
exports.readJSON = function readJSON(filepath) {
  const data = readFileSync(filepath, 'utf8');
  return JSON.parse(data);
};

exports.writeJSON = function writeJSON(filepath, data) {
  const json = JSON.stringify(data, null, 2);
  writeFileSync(filepath, json, 'utf8');
};

// Executes a shell command
exports.shell = function shell(cmd, path) {
  let cwd = ROOT_DIR;
  if (path) {
    cwd += `/${path}`;
  }

  return execSync(cmd, { cwd, encoding: 'utf8' });
};

exports.resolvePackages = function resolvePackages(rootDir) {
  const packages = readdirSync(rootDir);

  return packages.reduce((acc, name) => {
    const dir = path.join(rootDir, name);
    const stats = statSync(rootDir);

    // Only publish directories with package.json set to public
    if (stats.isDirectory()) {
      const package = readJSON(path.join(dir, 'package.json'));

      if (package.private !== true) {
        acc.set(package.name, { package, path: dir });
      }
    }

    return acc;
  }, new Map());
};

