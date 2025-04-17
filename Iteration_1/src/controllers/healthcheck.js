const HealthCheck = require('../models/healthcheck');

const healthCheck = async (req, res) => {
  // Check if request has any payload
  if (Object.keys(req.body).length > 0 || Object.keys(req.query).length > 0) {
    return res.status(400).set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    }).end();
  }

  try {
    // Insert a new health check record
    await HealthCheck.create({
      datetime: new Date()
    });
    
    // Return success with proper headers
    return res.status(200).set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    }).end();
  } catch (error) {
    console.error('Health check failed:', error);
    
    // Return service unavailable with proper headers
    return res.status(503).set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    }).end();
  }
};

module.exports = {
  healthCheck
};