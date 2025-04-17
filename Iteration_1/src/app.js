const express = require('express');
const healthzRoutes = require('./routes/healthz');

// Create our web application
const app = express();

// Parse JSON requests (important!)
app.use(express.json());

// Check requests to /healthz for body content
app.use('/healthz', (req, res, next) => {
  // If GET request has a body, return error 400
  if (req.method === 'GET' && req.headers['content-length'] && parseInt(req.headers['content-length']) > 0) {
    return res.status(400).set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    }).end();
  }
  next(); // Continue to next handler
});

// Use our health check routes for /healthz path
app.use('/healthz', healthzRoutes);

// For any other path, return 404 Not Found
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

module.exports = app;