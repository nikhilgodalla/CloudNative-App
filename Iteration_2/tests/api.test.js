const request = require('supertest');
const { app } = require('../src/index');
const { pool } = require('../src/db');

// Setup before tests
beforeAll(async () => {
  // Create test table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE
    )
  `);
  
  // Clear the table before testing
  await pool.query('DELETE FROM users');
});

// Cleanup after tests
afterAll(async () => {
  // Close pool to end test gracefully
  await pool.end();
});

describe('API Endpoints', () => {
  // Test health endpoint
  describe('GET /api/health', () => {
    it('should return 200 status code', async () => {
      const response = await request(app).get('/api/health');
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('healthy');
    });
  });
  
  // Test user creation - success scenario
  describe('POST /api/users', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com'
      };
      
      const response = await request(app)
        .post('/api/users')
        .send(userData);
      
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe(userData.username);
      expect(response.body.email).toBe(userData.email);
    });
    
    // Test user creation - failure scenario (missing fields)
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ username: 'incomplete' });
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    // Test user creation - failure scenario (duplicate user)
    it('should return 409 if user already exists', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com'
      };
      
      const response = await request(app)
        .post('/api/users')
        .send(userData);
      
      expect(response.statusCode).toBe(409);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  // Test get user - success scenario
  describe('GET /api/users/:id', () => {
    it('should get user by ID', async () => {
      // First create a user to get
      const createUserData = {
        username: 'getuser',
        email: 'get@example.com'
      };
      
      const createResponse = await request(app)
        .post('/api/users')
        .send(createUserData);
      
      const userId = createResponse.body.id;
      
      // Now get the user
      const response = await request(app).get(`/api/users/${userId}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.id).toBe(userId);
      expect(response.body.username).toBe(createUserData.username);
    });
    
    // Test get user - failure scenario (not found)
    it('should return 404 if user not found', async () => {
      const response = await request(app).get('/api/users/999999');
      
      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});