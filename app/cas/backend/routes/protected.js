import express from 'express';
const router = express.Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Protected API endpoints
router.get('/user', requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

router.get('/protected-data', requireAuth, (req, res) => {
  res.json({ 
    message: 'This is protected data from CAS backend',
    timestamp: new Date().toISOString(),
    user: req.session.user
  });
});

router.get('/app2-data', requireAuth, (req, res) => {
    res.json({ 
        message: 'Protected data',
        app: 'Application 2 - HR System',
        user: req.session.user,
        timestamp: new Date().toISOString()
    });
});

export default router;