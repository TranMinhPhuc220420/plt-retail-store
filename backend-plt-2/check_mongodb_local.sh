echo "=== MongoDB Local Check ==="

# Check service status
echo "1. Service Status:"
if systemctl is-active --quiet mongod; then
    echo "✅ MongoDB service is running"
else
    echo "❌ MongoDB service is not running"
    echo "Try: sudo systemctl start mongod"
fi

# Check port using ss (thay thế netstat)
echo "2. Port 27017:"
if ss -tlnp | grep -q :27017; then
    echo "✅ Port 27017 is listening"
    ss -tlnp | grep :27017
else
    echo "❌ Port 27017 is not listening"
fi

# Check connection
echo "3. MongoDB Connection:"
if mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
    echo "✅ MongoDB connection successful"
    echo "Connection string: mongodb://localhost:27017"
else
    echo "❌ Cannot connect to MongoDB"
fi

# Check MongoDB processes
echo "4. MongoDB Processes:"
if pgrep -f mongod > /dev/null; then
    echo "✅ MongoDB process is running"
    ps aux | grep -v grep | grep mongod
else
    echo "❌ No MongoDB process found"
fi

echo "=== End Check ==="