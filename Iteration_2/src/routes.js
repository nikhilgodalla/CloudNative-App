const express = require('express');
const { pool } = require('./db');

const router = express.Router();

// GET /health - Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1 as status');
    if (result[0].status === 1) {
      return res.status(200).json({ status: 'healthy', message: 'API is working properly' });
    }
    throw new Error('Database check failed');
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(503).json({ status: 'unhealthy', message: 'API is not working properly' });
  }
});

// POST /users - Create a new user
router.post('/users', async (req, res) => {
  try {
    const { username, email } = req.body;
    
    // Validate input
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }
    
    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    
    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO users (username, email) VALUES (?, ?)',
      [username, email]
    );
    
    return res.status(201).json({
      id: result.insertId,
      username,
      email
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users/:id - Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user by ID
    const [users] = await pool.query(
      'SELECT id, username, email FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;