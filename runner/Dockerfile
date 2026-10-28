FROM node:24.22.1-alpine
RUN apk add --no-cache docker-cli
WORKDIR /runner
COPY . .
CMD ["sh", "-c", "docker build -t script-lab-sandbox:1 sandbox && node server.mjs"]
