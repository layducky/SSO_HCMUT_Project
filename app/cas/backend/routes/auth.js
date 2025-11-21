import express from 'express';
const router = express.Router();

// Mock user database
const users = [
  { id: 1, username: 'ndcuong', password: 'ndcuong', email: 'ndcuong@example.com' },
  { id: 2, username: 'crypto', password: 'crypto', email: 'crypto@example.com' }
];

// CAS Login endpoint
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    const serviceTicket = `ST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    req.session.serviceTicket = serviceTicket;
    req.session.user = user;
    
    res.json({
      success: true,
      serviceTicket,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

router.get('/validate', (req, res) => {
  const { service, ticket } = req.query;
  
  if (!ticket) {
    return res.status(400).json({ success: false, message: 'No ticket provided' });
  }
  
  if (ticket.startsWith('ST-')) {
    res.json({
      success: true,
      user: 'demo-user',
      attributes: {
        email: 'demo@example.com',
        displayName: 'Demo User'
      }
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid ticket' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Check authentication status
router.get('/status', (req, res) => {
  if (req.session.user) {
    res.json({ 
      authenticated: true, 
      user: req.session.user 
    });
  } else {
    res.json({ authenticated: false });
  }
});

export default router;