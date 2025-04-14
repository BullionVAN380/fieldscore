import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from './db';
import farmerRoutes from './routes/farmer';
import mpesaRoutes from './routes/mpesa';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://10.0.2.2:3000', 'http://localhost:19006', 'http://localhost:8083', 'http://127.0.0.1:8083'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

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
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  res.json({
    status: mongoStatus === 1 ? 'healthy' : 'unhealthy',
    database: {
      status: mongoStatus === 1 ? 'connected' : 'disconnected',
      readyState: mongoStatus
    },
    env: {
      mpesa: !!process.env.MPESA_CONSUMER_KEY,
      mongodb: !!process.env.MONGODB_URI
    }
  });
});

// Routes
app.use('/api/farmers', farmerRoutes);
// Health check endpoint

app.use('/api/mpesa', mpesaRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
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
