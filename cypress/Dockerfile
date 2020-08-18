FROM cypress/included:4.12.1
WORKDIR /e2e

RUN apt-get -q update && apt-get -qy install netcat wget
RUN wget https://raw.githubusercontent.com/eficode/wait-for/master/wait-for
RUN chmod +x ./wait-for

COPY ./cypress.sh ./cypress.sh
RUN chmod +x cypress.sh

# npm run test
CMD [ "bootstrap.js" ]
ENTRYPOINT [ "./cypress.sh" ]
