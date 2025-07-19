import { config } from 'dotenv';
config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

import passport from 'passport';
import './config/passport.js';

import connectDB from './config/database.js';
import { sessionMiddleware } from './config/session.js';
import apiRoutes from './routes/api/index.js';
import uploadRoutes from './routes/upload/index.js';
import pictureRoutes from './routes/picture/index.js';
import authRoutes from './routes/auth/auth.route.js';

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
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(join(__dirname, '../public')));
app.use('/p/stores', express.static(join(__dirname, '../storage')));

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

export default app;
