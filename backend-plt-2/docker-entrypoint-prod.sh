#!/bin/sh

# Production entrypoint script that handles storage permissions securely
set -e

# Function to ensure storage directories exist with proper permissions
setup_storage_directories() {
    echo "Setting up storage directories..."
    
    # Create storage directories if they don't exist
    mkdir -p /app/storage/stores/avatars
    mkdir -p /app/storage/products/avatars
    mkdir -p /app/storage/employees/avatars
    
    # Check if we're running as root (needed to fix permissions)
    if [ "$(id -u)" = "0" ]; then
        echo "Running as root, fixing storage permissions..."
        
        # Fix ownership of storage directories
        chown -R nodejs:nodejs /app/storage
        
        # Set proper permissions (rwxrwxr-x)
        chmod -R 775 /app/storage
        
        echo "Storage permissions fixed successfully"
        
        # Switch to nodejs user and execute the command
        echo "Switching to nodejs user..."
        exec su-exec nodejs "$@"
    else
        echo "Already running as nodejs user"
        # Check if we can write to storage
        if [ -w /app/storage ]; then
            echo "Storage is writable"
        else
            echo "WARNING: Storage directory is not writable!"
        fi
        
        # Execute the command as current user
        exec "$@"
    fi
}

# Main execution
echo "PLT Backend Production Entrypoint"
echo "================================="

# Set up storage directories
setup_storage_directories "$@"
