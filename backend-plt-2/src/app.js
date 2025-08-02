require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { join, dirname } = require('path');
const cookieParser = require('cookie-parser');

const passport = require('passport');
require('./config/passport');

const connectDB = require('./config/database');
const { sessionMiddleware } = require('./config/session');
const { requestLogger, errorHandler, notFoundHandler } = require('./middlewares/logger');
const apiRoutes = require('./routes/api/index');
const uploadRoutes = require('./routes/upload/index');
const pictureRoutes = require('./routes/picture/index');
const authRoutes = require('./routes/auth/auth.route');

const app = express();

// Connect to database
connectDB();

const corsOptions = {
  origin: [process.env.CORS_ORIGIN],
  credentials: true
};

// Middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(requestLogger); // Use structured logging instead of morgan
app.use(cookieParser());
app.use(passport.initialize());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
app.use(sessionMiddleware);

// Static files
app.use(express.static(join(__dirname, '../public')));
app.use('/p/stores', express.static(join(dirname(__filename), '../storage')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api', apiRoutes);
app.use('/upload', uploadRoutes);
app.use('/p', pictureRoutes);
app.use('/auth', authRoutes);

// Html test login page
app.get('/login', (req, res) => {
  res.sendFile(join(__dirname, '../public/login.html'));
});

// Error handling middlewares (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
