const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');

const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { setupSockets } = require('./sockets/socketHandler');
const storyExpiryService = require('./services/storyExpiryService');
const { UPLOADS_DIR } = require('./middleware/upload');

// Route imports
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const postsRoutes = require('./routes/posts.routes');
const storiesRoutes = require('./routes/stories.routes');
const chatRoutes = require('./routes/chat.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const reportsRoutes = require('./routes/reports.routes');
const adminRoutes = require('./routes/admin.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});
setupSockets(io);

// Security & Parsing Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiter
app.use('/api/', apiLimiter);

// Serve Static Uploads
app.use('/uploads', express.static(UPLOADS_DIR));

// Healthcheck Route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'connectly-api',
    uptime: Math.floor(process.uptime())
  });
});

// Mount Routes (supporting both /api/v1/ and direct roots per spec)
app.use('/api/v1/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/v1/users', usersRoutes);
app.use('/users', usersRoutes);

const postController = require('./controllers/postController');
const { optionalAuth } = require('./middleware/auth');

app.use('/api/v1/posts', postsRoutes);
app.use('/posts', postsRoutes);
app.get('/feed', optionalAuth, postController.getFeed);
app.get('/api/v1/feed', optionalAuth, postController.getFeed);


app.use('/api/v1/stories', storiesRoutes);
app.use('/stories', storiesRoutes);

app.use('/api/v1/conversations', chatRoutes);
app.use('/conversations', chatRoutes);

app.use('/api/v1/notifications', notificationsRoutes);
app.use('/notifications', notificationsRoutes);

app.use('/api/v1/reports', reportsRoutes);
app.use('/reports', reportsRoutes);

app.use('/api/v1/admin', adminRoutes);
app.use('/admin', adminRoutes);

app.use('/api/v1/upload', uploadRoutes);
app.use('/upload', uploadRoutes);

// Serve Mobile Client Web Distribution if built
const fs = require('fs');
const MOBILE_DIST_DIR = path.join(__dirname, '..', '..', 'mobile', 'dist');
if (fs.existsSync(MOBILE_DIST_DIR)) {
  app.use(express.static(MOBILE_DIST_DIR));
  app.get('*', (req, res, next) => {
    const isApi = req.url.startsWith('/api') || req.url.startsWith('/auth') || req.url.startsWith('/feed') || 
                  req.url.startsWith('/posts') || req.url.startsWith('/stories') || req.url.startsWith('/conversations') || 
                  req.url.startsWith('/notifications') || req.url.startsWith('/reports') || req.url.startsWith('/admin') || 
                  req.url.startsWith('/upload');
    if (isApi) return next();
    res.sendFile(path.join(MOBILE_DIST_DIR, 'index.html'));
  });
}

// Fallback 404 for unmatched API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`
    }
  });
});


// Global Error Handler
app.use(errorHandler);

// Start Story Expiry Cron Worker
storyExpiryService.start();

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL && !process.env.SERVERLESS) {
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Connectly API Server running on port ${PORT}`);
    console.log(`📡 WebSocket / Socket.IO live and ready`);
    console.log(`📂 Uploads directory: ${UPLOADS_DIR}`);
    console.log(`====================================================`);
  });
}

module.exports = { app, server, io };
