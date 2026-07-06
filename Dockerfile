# Build stage — install all deps, build Vue client
FROM node:20-alpine AS builder

WORKDIR /app

# Root dependencies
COPY package*.json ./
RUN npm ci

# Client dependencies
COPY client/package*.json client/
RUN cd client && npm ci

# Source
COPY . .

# Build Vue frontend
RUN cd client && npx vite build

# ============================================
# Production stage — minimal runtime
FROM node:20-alpine

WORKDIR /app

# Only production dependencies
COPY package*.json ./
RUN npm ci --production

# Built client from builder
COPY --from=builder /app/client/dist ./client/dist

# Server source
COPY server/ ./server/

# Ensure writable directories for SQLite + uploads
RUN mkdir -p data uploads

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server/index.js"]
