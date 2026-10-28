FROM node:24.22.1-alpine
WORKDIR /opt/app
COPY package*.json ./
RUN npm ci --no-fund --no-audit && npm cache clean --force
COPY execute.cjs ./
USER 65534:65534
ENV NODE_ENV=production
CMD ["node", "--max-old-space-size=160", "/opt/app/execute.cjs"]
