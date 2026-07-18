# ── Stage 1: Build static assets ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies (npm ci is preferred for clean, reproducible installations)
RUN npm ci

# Copy source code
COPY . .

# Set dynamic API URL to relative path. This ensures Nginx proxies requests on
# /api/ to the backend container.
ENV VITE_API_URL=/api

# Build the production React app (compiles to /app/dist)
RUN npm run build

# ── Stage 2: Serve using Nginx ────────────────────────────────────────────────
FROM nginx:alpine

# Why multi-stage builds are used:
# 1. Minimise image size: We compile our frontend files using Node.js but do not need Node.js
#    to run the app. In the final stage, we copy only the compiled static assets (HTML/CSS/JS)
#    into a lightweight Nginx server.
# 2. Security and efficiency: No compiler toolchains, package managers (npm), or raw source
#    code are present in the runtime environment. This reduces vulnerability surfaces and
#    leads to incredibly small image sizes.

# Copy the built files from Stage 1 to Nginx default html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
