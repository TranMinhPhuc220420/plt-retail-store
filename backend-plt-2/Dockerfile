FROM node:18-alpine

# Install dumb-init and su-exec for proper signal handling and user switching
RUN apk add --no-cache dumb-init su-exec

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy and make entrypoint script executable
COPY docker-entrypoint-prod.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create necessary directories with proper permissions
RUN mkdir -p /app/storage/user/avatars /app/storage/stores/avatars /app/storage/products/avatars /app/storage/employees/avatars && \
    chown -R nodejs:nodejs /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY --chown=nodejs:nodejs . .

# Expose port
EXPOSE 5000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use custom entrypoint to handle permissions, then start with dumb-init
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh", "dumb-init", "--"]
CMD ["npm", "start"]