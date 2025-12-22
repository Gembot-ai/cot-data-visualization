# Multi-stage Dockerfile for Railway deployment
# Builds both backend and frontend in a single container

# Stage 1: Build Backend
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

COPY cot-backend/package*.json ./
RUN npm install

COPY cot-backend/tsconfig.json ./
COPY cot-backend/src ./src

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
COPY --from=backend-builder /app/backend/dist ./cot-backend/dist
COPY --from=backend-builder /app/backend/node_modules ./cot-backend/node_modules
COPY --from=backend-builder /app/backend/package*.json ./cot-backend/

# Copy backend source (needed for tsx to run railway-init.ts)
COPY cot-backend/src ./cot-backend/src
COPY cot-backend/tsconfig.json ./cot-backend/

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./cot-frontend/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

WORKDIR /app/cot-backend

EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start command: init database then start server
CMD ["npm", "start"]
