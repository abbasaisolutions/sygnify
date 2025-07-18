const express = require('express');
const { db } = require('../config');
const { authenticateToken } = require('./auth');
const router = express.Router();

router.get('/results', authenticateToken, async (req, res) => {
  try {
    const results = db.prepare(
      'SELECT * FROM analysis_results WHERE user_id = (SELECT id FROM users WHERE username = ?) ORDER BY created_at DESC LIMIT 10'
    ).all(req.user.username);
    
    res.status(200).json(results.map(row => ({
      label: row.analysis_type,
      value: 0, // Default value for now
      narrative: row.insights || 'No insights available',
      insights: row.insights ? JSON.parse(row.insights) : []
    })));
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const results = db.prepare(
      'SELECT insights FROM analysis_results WHERE user_id = (SELECT id FROM users WHERE username = ?) ORDER BY created_at DESC LIMIT 10'
    ).all(req.user.username);
    
    const insights = results.flatMap(row => {
      try {
        return row.insights ? JSON.parse(row.insights) : [];
      } catch (e) {
        return [];
      }
    });
    
    res.status(200).json(insights);
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

module.exports = router;