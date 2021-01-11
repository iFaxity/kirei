// runs cypress tests
// todo, add arguments to load another config file
const { spawn } = require('child_process');
const waitOn = require('wait-on');
const cypress = require('cypress');

// wait-on options
const opts = {
  timeout: 30000,
  resources: [ 'http-get://localhost:3000' ],
};

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
}

main().catch(console.error);
