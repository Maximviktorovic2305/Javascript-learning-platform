FROM node:24.22.1-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY vendor ./vendor
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:24.22.1-alpine
WORKDIR /app
COPY --from=build /app/.output ./.output
USER node
ENV HOST=0.0.0.0 PORT=3020
EXPOSE 3020
CMD ["node", ".output/server/index.mjs"]
