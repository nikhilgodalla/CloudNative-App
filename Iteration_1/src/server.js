const app = require('./app');
const { connectDatabase } = require('./config/database');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Try to connect to the database
    const dbConnected = await connectDatabase();
    
    // Start the server regardless of database connection
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      
      if (dbConnected) {
        console.log('Database connection successful - health checks will work properly');
      } else {
        console.log('WARNING: Database connection failed - health checks will return 503 errors');
      }
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try a different port.`);
      }
    });
  } catch (error) {
    console.error('Unexpected error during server startup:', error);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

startServer();