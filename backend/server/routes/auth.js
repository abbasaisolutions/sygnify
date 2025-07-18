const express = require('express');
    const jwt = require('jsonwebtoken');
    const bcrypt = require('bcrypt');
    const { db } = require('../config');
    const router = express.Router();

    router.post('/login', async (req, res) => {
      const { email, password } = req.body;
      try {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (user && await bcrypt.compare(password, user.password)) {
          const token = jwt.sign({ email, name: user.name, role: user.role }, process.env.JWT_SECRET || 'default-secret', { expiresIn: '1h' });
          res.json({ token, user: { email: user.email, name: user.name, role: user.role } });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
        }
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    router.post('/register', async (req, res) => {
      const { email, password, name } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      try {
        const insert = db.prepare(
          'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)'
        );
        insert.run(email, hashedPassword, name || 'User', 'user');
        res.status(201).json({ message: 'User registered successfully' });
      } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ error: 'Email already exists' });
      }
    });

    function authenticateToken(req, res, next) {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'No token provided' });
      jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
      });
    }

    module.exports = { router, authenticateToken };