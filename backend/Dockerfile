FROM node:24.22.1-alpine AS build
WORKDIR /app
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
COPY vendor ./vendor
RUN npm ci --no-audit --no-fund
COPY nest-cli.json tsconfig*.json ./
COPY src ./src
RUN npm run build

FROM node:24.22.1-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/vendor ./vendor
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY package*.json ./
USER node
EXPOSE 8020
CMD ["node", "dist/main.js"]
