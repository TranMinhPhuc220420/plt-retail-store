require('dotenv').config();

const session = require('express-session');
const MongoStore = require('connect-mongo');

// Configure session middleware with fallback for testing
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'test-session-secret',
  store: process.env.MONGODB_URI ? MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }) : undefined, // Skip store for tests without MongoDB
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
})

module.exports = { sessionMiddleware };