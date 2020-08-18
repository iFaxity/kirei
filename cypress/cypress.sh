#!/usr/bin/env bash
npm run dev &
./wait-for -t 30 localhost:3000
cypress run -C cypress/cypress.json -s "cypress/integration/$@"
