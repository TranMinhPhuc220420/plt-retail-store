const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const costUpdateManager = require('./costUpdateManager');

/**
 * WebSocket Server for Real-time Cost Updates
 */
class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map of user ID to WebSocket connections
  }

  /**
   * Initialize WebSocket server
   * @param {http.Server} server - HTTP server instance
   */
  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/cost-updates',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log('🔌 WebSocket server initialized for cost updates');
  }

  /**
   * Verify client authentication
   * @param {Object} info - Client connection info
   * @returns {boolean} Whether client is authenticated
   */
  verifyClient(info) {
    try {
      const url = new URL(info.req.url, `http://${info.req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        console.log('❌ WebSocket connection rejected: No token provided');
        return false;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      info.req.user = decoded;
      return true;

    } catch (error) {
      console.log('❌ WebSocket connection rejected: Invalid token', error.message);
      return false;
    }
  }

  /**
   * Handle new WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   * @param {http.IncomingMessage} req - HTTP request
   */
  handleConnection(ws, req) {
    const user = req.user;
    const userId = user.id;

    console.log(`✅ WebSocket connected: User ${userId} (${user.username})`);

    // Store client connection
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);

    // Register with cost update manager
    costUpdateManager.registerWebSocketClient(ws);

    // Send initial connection confirmation
    this.sendToClient(ws, {
      type: 'CONNECTION_ESTABLISHED',
      userId,
      timestamp: new Date().toISOString(),
      message: 'Connected to real-time cost updates'
    });

    // Handle client messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(ws, user, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        this.sendToClient(ws, {
          type: 'ERROR',
          message: 'Invalid message format'
        });
      }
    });

    // Handle connection close
    ws.on('close', () => {
      console.log(`❌ WebSocket disconnected: User ${userId}`);
      
      if (this.clients.has(userId)) {
        this.clients.get(userId).delete(ws);
        if (this.clients.get(userId).size === 0) {
          this.clients.delete(userId);
        }
      }
    });

    // Handle connection errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
    });
  }

  /**
   * Handle messages from client
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} user - User information
   * @param {Object} message - Client message
   */
  handleClientMessage(ws, user, message) {
    const { type, data } = message;

    switch (type) {
      case 'PING':
        this.sendToClient(ws, { type: 'PONG', timestamp: new Date().toISOString() });
        break;

      case 'SUBSCRIBE_STORE':
        // Subscribe to updates for specific store
        this.handleStoreSubscription(ws, user, data.storeId);
        break;

      case 'UNSUBSCRIBE_STORE':
        // Unsubscribe from store updates
        this.handleStoreUnsubscription(ws, user, data.storeId);
        break;

      case 'GET_QUEUE_STATUS':
        // Send current update queue status
        const status = costUpdateManager.getQueueStatus();
        this.sendToClient(ws, {
          type: 'QUEUE_STATUS',
          data: status
        });
        break;

      default:
        this.sendToClient(ws, {
          type: 'ERROR',
          message: `Unknown message type: ${type}`
        });
    }
  }

  /**
   * Handle store subscription
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} user - User information
   * @param {string} storeId - Store ID to subscribe to
   */
  handleStoreSubscription(ws, user, storeId) {
    if (!ws.subscribedStores) {
      ws.subscribedStores = new Set();
    }
    
    ws.subscribedStores.add(storeId);
    
    // this.sendToClient(ws, {
    //   type: 'SUBSCRIPTION_CONFIRMED',
    //   storeId,
    //   message: `Subscribed to cost updates for store ${storeId}`
    // });
  }

  /**
   * Handle store unsubscription
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} user - User information
   * @param {string} storeId - Store ID to unsubscribe from
   */
  handleStoreUnsubscription(ws, user, storeId) {
    if (ws.subscribedStores) {
      ws.subscribedStores.delete(storeId);
    }
    
    // this.sendToClient(ws, {
    //   type: 'UNSUBSCRIPTION_CONFIRMED',
    //   storeId,
    //   message: `Unsubscribed from cost updates for store ${storeId}`
    // });
  }

  /**
   * Send message to specific client
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} message - Message to send
   */
  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          ...message,
          timestamp: message.timestamp || new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    }
  }

  /**
   * Broadcast message to all connected clients
   * @param {Object} message - Message to broadcast
   * @param {string} storeId - Optional store ID filter
   */
  broadcast(message, storeId = null) {
    this.wss.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        // Filter by store subscription if specified
        if (storeId && ws.subscribedStores && !ws.subscribedStores.has(storeId)) {
          return;
        }
        
        this.sendToClient(ws, message);
      }
    });
  }

  /**
   * Send message to specific user
   * @param {string} userId - User ID
   * @param {Object} message - Message to send
   */
  sendToUser(userId, message) {
    const userConnections = this.clients.get(userId);
    if (userConnections) {
      userConnections.forEach(ws => {
        this.sendToClient(ws, message);
      });
    }
  }

  /**
   * Get connection statistics
   * @returns {Object} Connection statistics
   */
  getStats() {
    const totalConnections = this.wss ? this.wss.clients.size : 0;
    const uniqueUsers = this.clients.size;
    
    return {
      totalConnections,
      uniqueUsers,
      averageConnectionsPerUser: uniqueUsers > 0 ? totalConnections / uniqueUsers : 0
    };
  }

  /**
   * Close all connections and shutdown
   */
  shutdown() {
    if (this.wss) {
      this.wss.clients.forEach(ws => {
        ws.close(1000, 'Server shutting down');
      });
      this.wss.close();
    }
    this.clients.clear();
    console.log('🔌 WebSocket server shut down');
  }
}

// Export singleton instance
module.exports = new WebSocketManager();
