const express = require('express');
const cors = require('cors');
const config = require('./config/config');

// Route imports
const authRoutes = require('./modules/auth/auth.routes');
const doctorsRoutes = require('./modules/doctors/doctors.routes');
const onboardingRoutes = require('./modules/onboarding/onboarding.routes');
const chatsRoutes = require('./modules/chats/chats.routes');
const messagesRoutes = require('./modules/messages/messages.routes');

// Middleware imports
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [config.cors.frontendUrl, 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── BODY PARSING ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Medigence API is running',
    data: {
      timestamp: new Date().toISOString(),
      env: config.nodeEnv,
    },
  });
});

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/messages', messagesRoutes);

// ─── 404 HANDLER ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    data: {},
  });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
