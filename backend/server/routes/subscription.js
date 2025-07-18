const express = require('express');
const { authenticateToken } = require('./auth');
const { db } = require('../config');
const router = express.Router();

router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    // Mock subscription creation for development
    res.json({ id: 'mock_session_id', message: 'Mock subscription created' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = db.prepare('SELECT subscription_status FROM users WHERE username = ?').get(req.user.username);
    res.json({ status: user?.subscription_status || 'inactive' });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

module.exports = router;