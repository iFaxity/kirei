FROM cypress/included:4.12.1
WORKDIR /e2e

RUN apt-get -q update && apt-get -qy install netcat wget
RUN wget https://raw.githubusercontent.com/eficode/wait-for/master/wait-for
RUN chmod +x ./wait-for

RUN printf '%s\n' \
  '#!/usr/bin/env bash' \
  'npm run dev &' \
  './wait-for -t 30 localhost:3000' \
  'cypress run -C cypress/cypress.json -s "cypress/integration/$1"' \
  > ./cypress.sh
RUN chmod +x cypress.sh

# npm run test
CMD [ "bootstrap.js" ]
ENTRYPOINT [ "./cypress.sh" ]
