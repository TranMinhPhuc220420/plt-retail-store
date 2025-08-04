import { useState, useEffect, useRef } from 'react';
import { message } from 'antd';

/**
 * Custom hook for real-time cost updates via WebSocket
 * @param {string} token - JWT authentication token
 * @param {Array} storeIds - Array of store IDs to subscribe to
 * @returns {Object} WebSocket connection state and utilities
 */
const useRealTimeCostUpdates = (token, storeIds = []) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [queueStatus, setQueueStatus] = useState({
    isProcessing: false,
    queueLength: 0,
    connectedClients: 0
  });

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  /**
   * Connect to WebSocket server
   */
  const connect = () => {
    if (!token) {
      console.warn('No token provided for WebSocket connection');
      return;
    }

    try {
      const wsUrl = `ws://localhost:5000/ws/cost-updates?token=${encodeURIComponent(token)}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected for cost updates');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;

        // Subscribe to stores
        storeIds.forEach(storeId => {
          if (storeId) {
            wsRef.current.send(JSON.stringify({
              type: 'SUBSCRIBE_STORE',
              data: { storeId }
            }));
          }
        });

        // Request initial queue status
        wsRef.current.send(JSON.stringify({
          type: 'GET_QUEUE_STATUS'
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('❌ WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionError('Failed to reconnect after maximum attempts');
          message.error('Real-time updates disconnected. Please refresh the page.');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket connection error');
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionError('Failed to create WebSocket connection');
    }
  };

  /**
   * Handle incoming WebSocket messages
   * @param {Object} data - Message data
   */
  const handleWebSocketMessage = (data) => {
    const { type, timestamp } = data;

    setLastUpdate({
      type,
      data,
      timestamp: new Date(timestamp)
    });

    switch (type) {
      case 'CONNECTION_ESTABLISHED':
        message.success('Real-time cost updates connected', 2);
        break;

      case 'COST_UPDATE':
        handleCostUpdate(data.data);
        break;

      case 'INGREDIENT_COST_CHANGED':
        message.info(`Ingredient cost updated (${data.affectedRecipes} recipes affected)`, 4);
        break;

      case 'RECIPE_COST_CHANGED':
        message.info(`Recipe cost updated (${data.affectedProducts} products affected)`, 4);
        break;

      case 'PRODUCT_COST_CHANGED':
        message.info(`Product cost updated (${data.affectedComposites} composites affected)`, 4);
        break;

      case 'COMPOSITE_COST_UPDATED':
        message.success('Composite product cost updated', 3);
        break;

      case 'QUEUE_STATUS':
        setQueueStatus(data.data);
        break;

      case 'MASS_RECALCULATION_STARTED':
        message.loading(`Recalculating costs for ${data.recipesCount} recipes and ${data.productsCount} products...`, 0);
        break;

      case 'CACHE_CLEARED':
        message.info(`Cost caches cleared by ${data.clearedBy}`, 3);
        break;

      case 'UPDATE_ERROR':
        message.error(`Cost update failed: ${data.error}`, 5);
        break;

      case 'PONG':
        // Handle ping/pong for connection health
        break;

      default:
        console.log('Unknown WebSocket message type:', type, data);
    }
  };

  /**
   * Handle cost update events
   * @param {Object} updateData - Cost update data
   */
  const handleCostUpdate = (updateData) => {
    // This can be customized based on what components need to react
    // For now, just log the update
    console.log('💰 Cost update received:', updateData);
    
    // You can dispatch custom events here for components to listen to
    window.dispatchEvent(new CustomEvent('costUpdate', {
      detail: updateData
    }));
  };

  /**
   * Send ping to keep connection alive
   */
  const sendPing = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'PING' }));
    }
  };

  /**
   * Subscribe to additional store
   * @param {string} storeId - Store ID to subscribe to
   */
  const subscribeToStore = (storeId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && storeId) {
      wsRef.current.send(JSON.stringify({
        type: 'SUBSCRIBE_STORE',
        data: { storeId }
      }));
    }
  };

  /**
   * Unsubscribe from store
   * @param {string} storeId - Store ID to unsubscribe from
   */
  const unsubscribeFromStore = (storeId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && storeId) {
      wsRef.current.send(JSON.stringify({
        type: 'UNSUBSCRIBE_STORE',
        data: { storeId }
      }));
    }
  };

  /**
   * Disconnect WebSocket
   */
  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User initiated disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionError(null);
  };

  // Setup connection on mount and cleanup on unmount
  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token]);

  // Handle store subscriptions changes
  useEffect(() => {
    if (isConnected && storeIds.length > 0) {
      storeIds.forEach(storeId => {
        if (storeId) {
          subscribeToStore(storeId);
        }
      });
    }
  }, [isConnected, storeIds]);

  // Setup ping interval for connection health
  useEffect(() => {
    let pingInterval;
    
    if (isConnected) {
      pingInterval = setInterval(sendPing, 30000); // Ping every 30 seconds
    }

    return () => {
      if (pingInterval) {
        clearInterval(pingInterval);
      }
    };
  }, [isConnected]);

  return {
    isConnected,
    connectionError,
    lastUpdate,
    queueStatus,
    connect,
    disconnect,
    subscribeToStore,
    unsubscribeFromStore
  };
};

export default useRealTimeCostUpdates;
