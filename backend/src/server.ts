import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from './db';
import farmerRoutes from './routes/farmer';
import mpesaRoutes from './routes/mpesa';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

// CORS and security configuration
app.use(cors({
  origin: [
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:19006',
    `http://${process.env.LOCAL_IP}:8081`,
    `http://${process.env.LOCAL_IP}:8082`,
    `http://${process.env.LOCAL_IP}:19006`,
    'http://192.168.3.100:8081',
    'http://192.168.3.100:8082',
    'http://192.168.3.100:19006'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Security headers
app.use((req, res, next) => {
  // Log incoming requests for debugging
  console.log('Incoming request:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    host: req.headers.host
  });
  next();
});

// Body parsing middleware - must come before logging to properly parse and log request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState;
    const healthData = {
      status: mongoStatus === 1 ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: mongoStatus === 1 ? 'connected' : 'disconnected',
        readyState: mongoStatus
      },
      env: {
        mpesa: !!process.env.MPESA_CONSUMER_KEY,
        mongodb: !!process.env.MONGODB_URI
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check health status',
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/farmers', farmerRoutes);
app.use('/api/mpesa', mpesaRoutes);

// Log all unmatched routes
app.use((req, res, next) => {
  console.log('Unmatched route:', {
    method: req.method,
    url: req.url,
    body: req.body
  });
  next();
});

const host = '0.0.0.0';
app.listen(port, host, () => {
  console.log('----------------------------------------');
  console.log(`Server running on port ${port}`);
  console.log('Available on:');
  console.log(`  • Local:            http://localhost:${port}`);
  console.log(`  • Android Emulator: http://10.0.2.2:${port}`);
  console.log('----------------------------------------');
});
