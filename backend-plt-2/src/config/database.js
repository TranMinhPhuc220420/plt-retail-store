const mongoose = require('mongoose');
const { logInfo } = require('../middlewares/logger');

let connectionRetries = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

const connectDB = async () => {
  try {
    // Mongoose connection options for better performance and resilience
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      connectionRetries = 0; // Reset retry counter on successful connection
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('💥 Database connection error:', error.message);
    
    connectionRetries++;
    
    if (connectionRetries < MAX_RETRIES) {
      console.log(`🔄 Retrying database connection... (${connectionRetries}/${MAX_RETRIES})`);
      setTimeout(connectDB, RETRY_DELAY);
    } else {
      console.error('🚨 Maximum connection retries reached. Please check your MongoDB server.');
      // Don't exit the process immediately, let the application handle graceful degradation
      setTimeout(() => {
        console.error('🚨 Exiting application due to database connection failure');
        process.exit(1);
      }, 10000); // Give 10 seconds for graceful shutdown
    }
  }
};

module.exports = connectDB;
