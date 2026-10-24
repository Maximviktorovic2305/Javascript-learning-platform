FROM docker:28-cli
RUN apk add --no-cache nodejs npm
WORKDIR /runner
COPY . .
CMD ["sh", "-c", "docker build -t script-lab-sandbox:1 sandbox && node server.mjs"]
