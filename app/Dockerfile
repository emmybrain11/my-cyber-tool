### Multi-stage Dockerfile for production
FROM node:20-alpine AS builder
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --silent

# Build app (frontend + server bundle)
COPY . .
RUN npm run build

### Runtime image
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts and production deps
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/.env ./

EXPOSE 8088

CMD ["node", "dist/boot.js"]
FROM node:20-bullseye AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/api ./api
EXPOSE 3000
CMD ["node", "dist/boot.js"]
