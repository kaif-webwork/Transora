import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config, getLocalIpAddress } from './config/index.js';
import { initDatabase } from './db/index.js';
import authRoutes from './routes/authRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { setupSocketHandlers } from './sockets/transferSocketHandler.js';

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'unsafe-none' },
  })
);
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// OpenAPI Swagger Spec
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Transora API Specifications',
    version: '1.0.0',
    description: 'Enterprise-grade File Sharing API with progressive chunk upload and WebRTC P2P support.',
  },
  paths: {
    '/api/v1/auth/register': { post: { summary: 'Register User' } },
    '/api/v1/auth/login': { post: { summary: 'Login User' } },
    '/api/v1/transfers/init': { post: { summary: 'Initialize Transfer Session' } },
    '/api/v1/transfers/share/{shareCode}': { get: { summary: 'Resolve Share Link' } },
  },
};

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', transferRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health Check Endpoint
app.get(['/health', '/api/v1/health'], (req, res) => {
  res.json({ status: 'ok', service: 'Transora Backend', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'An unexpected backend error occurred' });
});

// Setup Socket.IO Event Gateway
setupSocketHandlers(io);

// Start Server listening on 0.0.0.0 for LAN & Mobile accessibility
async function startServer() {
  await initDatabase();
  const localIp = getLocalIpAddress();
  httpServer.listen(config.port, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(`🚀 Transora Backend running on http://0.0.0.0:${config.port}`);
    console.log(`📱 Mobile / LAN Access URL: http://${localIp}:${config.port}`);
    console.log(`📚 Swagger API Docs: http://${localIp}:${config.port}/docs`);
    console.log(`=================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal backend startup error:', err);
});
