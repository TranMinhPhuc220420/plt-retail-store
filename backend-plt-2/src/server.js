const app = require('./app');
const http = require('http');
const websocketManager = require('./utils/websocketManager');

const PORT = 5000; // Use fixed port to avoid conflicts

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
websocketManager.initialize(server);

console.log(`PORT variable: ${PORT}`);
console.log(`Environment PORT: ${process.env.PORT}`);
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 WebSocket server available at ws://localhost:${PORT}/ws/cost-updates`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  websocketManager.shutdown();
  server.close(() => {
    console.log('Process terminated');
  });
});"" 
 
