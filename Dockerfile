# Multi-stage Dockerfile for Railway deployment
# Builds both backend and frontend in a single container

# Stage 1: Build Backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build

# Stage 2: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY cot-frontend/package*.json ./
RUN npm install

COPY cot-frontend/ ./
RUN npm run build

# Stage 3: Production Runtime
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy backend
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package*.json ./

# Copy backend source (needed for tsx to run railway-init.ts)
COPY src ./src
COPY tsconfig.json ./

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./cot-frontend/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Set production environment
ENV NODE_ENV=production

EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start command: init database then start server
CMD ["npm", "start"]
