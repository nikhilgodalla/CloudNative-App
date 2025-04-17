const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Log the database connection parameters for debugging
console.log('Database connection parameters:');
console.log('Host:', process.env.DB_HOST || '127.0.0.1');
console.log('Database:', process.env.DB_NAME || 'healthcheck_db');
console.log('User:', process.env.DB_USER || 'Not set');
console.log('Password:', process.env.DB_PASSWORD ? '******' : 'Not set');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'healthcheck_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql',
    logging: false,
  }
);

const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    await sequelize.sync();
    console.log('Database bootstrapped successfully.');
    
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

module.exports = { sequelize, connectDatabase };