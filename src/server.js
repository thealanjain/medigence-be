require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config/config');
const { initSocket } = require('./sockets/socketHandler');

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.io
const io = new Server(server, {
  cors: {
    origin: [config.cors.frontendUrl, 'http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Initialize socket handlers
initSocket(io);

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]', err.message);
  shutdown('unhandledRejection');
});

// Start server
server.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║        🏥 Medigence Backend Server               ║
  ╠══════════════════════════════════════════════════╣
  ║  HTTP  : http://localhost:${config.port}                  ║
  ║  WS    : ws://localhost:${config.port}                    ║
  ║  ENV   : ${config.nodeEnv.padEnd(40)}║
  ╚══════════════════════════════════════════════════╝
  `);
});

module.exports = { server, io };
