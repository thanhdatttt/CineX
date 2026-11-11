FROM node:24-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/apps/api

COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci

COPY apps/api/prisma ./prisma
RUN npm run db:generate

COPY apps/api/ ./

EXPOSE 3000
CMD ["npm", "run", "start:dev"]
