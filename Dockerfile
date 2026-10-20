# Use official lightweight Node.js 20 LTS Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first for Docker caching
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Set default production environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose server port
EXPOSE 5000

# Health check to ensure service is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
