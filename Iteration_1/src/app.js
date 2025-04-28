const express = require('express');
const healthzRoutes = require('./routes/healthz');

// Create Express application
const app = express();

// Raw body parser for /healthz route to detect bodies without parsing them
app.use('/healthz', (req, res, next) => {
  // For GET requests to /healthz, block any request with a body
  if (req.method === 'GET' && req.headers['content-length'] && parseInt(req.headers['content-length']) > 0) {
    return res.status(400).set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    }).end();
  }
  next();
});

// Routes - put this BEFORE any body parsers
app.use('/healthz', healthzRoutes);

// Body parser middleware - only apply AFTER the /healthz route
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Catch-all route for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handler for syntax errors and other issues
app.use((err, req, res, next) => {
  console.error('Error handler caught:', err.message);
  
  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON' });
  }
  
  // Handle other errors
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

module.exports = app;