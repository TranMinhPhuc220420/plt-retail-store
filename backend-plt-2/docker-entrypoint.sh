#!/bin/sh

# Create storage directories if they don't exist
mkdir -p /app/storage/stores/avatars
mkdir -p /app/storage/products/avatars  
mkdir -p /app/storage/employees/avatars

# Fix permissions for storage directories
# In development, we need to ensure the nextjs user can write to mounted volumes
if [ "$NODE_ENV" = "development" ]; then
    # Check if we're running as root (needed to change permissions)
    if [ "$(id -u)" = "0" ]; then
        # Change ownership of storage directories
        chown -R nextjs:nodejs /app/storage
        # Switch to nextjs user and execute the command
        exec su-exec nextjs "$@"
    else
        # Already running as nextjs user, just execute the command
        exec "$@"
    fi
else
    # Production mode, just execute the command
    exec "$@"
fi
