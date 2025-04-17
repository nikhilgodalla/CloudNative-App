const express = require('express');
const router = express.Router();
const { healthCheck } = require('../controllers/healthcheck');

// When someone makes a GET request, run the healthCheck function
router.get('/', healthCheck);

// If they use any other method (POST, PUT, etc.), return error 405
router.all('/', (req, res) => {
  res.status(405).set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  }).end();
});

module.exports = router;