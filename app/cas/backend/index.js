import express from 'express';
import session from 'express-session';
import cors from 'cors';
import memoryStore from 'memorystore';
import authRoutes from './routes/auth.js';
import protectedRoutes from './routes/protected.js';

const app = express();
const MemoryStore = memoryStore(session);

app.use(cors({
  origin: true, 
  credentials: true
}));

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'cas-secret',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000 
  }),
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

// Routes
app.use('/auth', authRoutes);
app.use('/api', protectedRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'CAS Backend',
    timestamp: new Date().toISOString()
  });
});

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
  console.log(`CAS Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`CORS: Enabled for all origins`);
});