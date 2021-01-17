// runs cypress tests
// todo, add arguments to load another config file
const { resolve} = require('path');
const { spawn } = require('child_process');
const { rmdir, rm } = require('fs');
const waitOn = require('wait-on');
const cypress = require('cypress');

// wait-on options
const opts = {
  timeout: 30000,
  resources: [ 'http-get://localhost:3000' ],
};

function rmrf(path) {
  return new Promise((resolve, reject) => {
    const callback = (ex) => ex ? reject() : resolve();

    if (rm) {
      rm(path, { recursive: true, force: true }, callback);
    } else {
      rmdir(path, { recursive: true }, callback);
    }
  });
}

// if arg is given, pipe it into testFiles option
async function main() {
  const config = {};

  const testFiles = process.argv.slice(2);
  if (testFiles.length) {
    config.testFiles = testFiles;
  }

  // Run vite server
  const serve = spawn('yarn', [ 'dev' ], { stdio: 'ignore', cwd: process.cwd() });
  console.log('Starting the dev server on port 3000');

  // ensure process cleanup
  process.on('exit', () => serve.killed || serve.kill('SIGINT'));

  try {
    await waitOn(opts);
    console.log('Detected start of dev server. Running cypress.'),
    await cypress.run({ config, configFile: 'cypress.json' });
  } catch (ex) {
    console.error(ex);
    process.exit(1);
  } finally {
    serve.kill();
  }

  // Remove nyc cache directory
  try {
    await rmrf(resolve('./.nyc_output'));
  } catch (ex) {
    console.warn('Removal of nyc output directory failed.');
    console.error(ex);
  }
}

main().catch(console.error);
