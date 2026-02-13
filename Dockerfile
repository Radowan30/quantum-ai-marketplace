# AI Model Marketplace - Production Dockerfile
# Multi-stage build for optimized image size

# ============================================
# Stage 1: Build Stage
# ============================================
# Use Node 20 LTS (required by Supabase, Vite 7, and other packages)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
# Use npm ci for faster, more reliable installs (requires package-lock.json)
# If package-lock.json is missing, change to: RUN npm install
RUN npm ci

# Copy source code
COPY . .

# Accept build arguments for Vite environment variables
# These must be passed during docker build with --build-arg
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set as environment variables so Vite can embed them in the bundle
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build the application (Vite will embed the VITE_ env vars into JS bundle)
RUN npm run build

# ============================================
# Stage 2: Production Stage
# ============================================
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
# Both client (dist/public/) and server (dist/index.cjs) are in /app/dist
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]
