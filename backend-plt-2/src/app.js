require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { join, dirname } = require('path');
const cookieParser = require('cookie-parser');

const passport = require('passport');
require('./config/passport');

const connectDB = require('./config/database');
const { sessionMiddleware } = require('./config/session');
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
app.use(morgan('combined'));
app.use(cookieParser());
app.use(passport.initialize());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
app.use(sessionMiddleware);

// Static files
app.use(express.static(join(__dirname, '../public')));
app.use('/p/stores', express.static(join(dirname(__filename), '../storage')));

// Routes
app.use('/api', apiRoutes);
app.use('/upload', uploadRoutes);
app.use('/p', pictureRoutes);
app.use('/auth', authRoutes);

// Html test login page
app.get('/login', (req, res) => {
  res.sendFile(join(__dirname, '../public/login.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
