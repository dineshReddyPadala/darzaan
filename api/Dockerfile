FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY . .
RUN npx prisma generate --schema prisma/auth/schema.prisma \
  && npx prisma generate --schema prisma/core/schema.prisma \
  && npx prisma generate --schema prisma/notification/schema.prisma \
  && npm run build

FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 3000
CMD ["node", "scripts/start.mjs", "api-gateway"]
