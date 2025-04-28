const express = require('express');
const { testConnection } = require('./db');
const routes = require('./routes');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
async function startServer() {
  // Test database connection before starting the server
  const dbConnected = await testConnection();
  
  if (dbConnected) {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } else {
    console.error('Failed to connect to database. Server not started.');
    process.exit(1);
  }
}

// Export for testing
module.exports = { app, startServer };

// Start server if not being required (imported) for testing
if (require.main === module) {
  startServer();
}