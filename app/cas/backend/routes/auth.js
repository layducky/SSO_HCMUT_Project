import express from 'express';
const router = express.Router();

// Mock user database
const users = [
  { id: 1, username: 'user1', password: 'password1', email: 'user1@example.com' },
  { id: 2, username: 'user2', password: 'password2', email: 'user2@example.com' }
];

// CAS Login endpoint
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    // Generate service ticket (simplified)
    const serviceTicket = `ST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store ticket in session
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

// CAS Service Validate endpoint
router.get('/validate', (req, res) => {
  const { service, ticket } = req.query;
  
  if (!ticket) {
    return res.status(400).json({ success: false, message: 'No ticket provided' });
  }
  
  // In a real implementation, you'd validate the ticket against your ticket registry
  // For demo, we'll accept any ticket that starts with "ST-"
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

// Logout endpoint
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