import express from 'express';
import session from 'express-session';
import cors from 'cors';
import memoryStore from 'memorystore';

const app = express();
const MemoryStore = memoryStore(session);

// Middleware
app.use(cors({
  origin: ['http://localhost:3002', 'http://cas-frontend:3002'],
  credentials: true
}));

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'cas-secret',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000 // 24 hours
  }),
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Import routes sau khi express app được khởi tạo
import authRoutes from './routes/auth.js';
import protectedRoutes from './routes/protected.js';

// Routes
app.use('/auth', authRoutes);
app.use('/api', protectedRoutes);

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'CAS Backend',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'CAS Backend is running',
    endpoints: {
      health: '/health',
      auth: '/auth',
      api: '/api'
    }
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ CAS Backend running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});