FROM cypress/included:4.10.0
WORKDIR /e2e

RUN apt-get -q update && apt-get -qy install netcat wget
RUN wget https://raw.githubusercontent.com/eficode/wait-for/master/wait-for
RUN chmod +x ./wait-for

ENTRYPOINT npm run dev & ./wait-for -t 10 localhost:3000 -- npm run test
