# Cloud-Native Health Check API

A cloud-native backend application with a health check API using Node.js, Express, Sequelize, and MySQL.

## Project Overview

This application implements a simple health check API for a cloud-native web application. The API checks the database connection and returns appropriate HTTP status codes to indicate the health status of the application.

## Technology Stack

- **Programming Language**: JavaScript (Node.js)
- **Relational Database**: MySQL
- **Backend Framework**: Express.js
- **ORM Framework**: Sequelize

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm (v6 or higher)

## Setup and Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd webapp
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up MySQL database
   ```bash
   mysql -u root -p
   ```

   In the MySQL shell:
   ```sql
   CREATE DATABASE healthcheck_db;
   EXIT;
   ```

4. Configure environment variables
   - Create a `.env` file in the project root with the following content:
   ```
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=healthcheck_db
   PORT=3000
   ```

5. Run the application
   - For development: `npm run dev`
   - For production: `npm start`

## API Endpoints

### Health Check Endpoint: `/healthz`

- **Method**: GET
- **Description**: Checks if the application is healthy by testing the database connection
- **Success Response**: 
  - Status Code: 200 OK
  - Headers: 
    - `Cache-Control: no-cache, no-store, must-revalidate`
    - `Pragma: no-cache`
    - `X-Content-Type-Options: nosniff`
  - No response body
- **Error Response**: 
  - Status Code: 503 Service Unavailable (when database connection fails)
  - Headers: Same as success response
  - No response body
- **Bad Request**:
  - Status Code: 400 Bad Request (when request has a body or query parameters)
  - Headers: Same as success response
- **Method Not Allowed**:
  - Status Code: 405 Method Not Allowed (for non-GET requests)
  - Headers: Same as success response

## Project Structure

```
webapp/
├── .env
├── .gitignore
├── package.json
└── src/
    ├── app.js           # Express application setup
    ├── server.js        # Server entry point
    ├── config/
    │   └── database.js  # Database connection configuration
    ├── controllers/
    │   └── healthcheck.js # Health check controller logic
    ├── models/
    │   └── healthcheck.js # Healthcheck database model
    └── routes/
        └── healthz.js     # Health check route definitions
```

## Understanding the Workflow

1. **Application Startup**:
   - The application starts from `server.js`
   - It loads environment variables from `.env`
   - It connects to the MySQL database
   - It bootstraps the database (creates tables if they don't exist)
   - It starts the Express server on the configured port

2. **Health Check Process**:
   - When a GET request is made to `/healthz`:
     - The router validates that it's a GET request with no payload
     - The controller attempts to insert a record in the health check table
     - If successful, it returns HTTP 200 OK
     - If unsuccessful, it returns HTTP 503 Service Unavailable
   - All responses include headers to prevent caching

3. **Database Structure**:
   - A single `healthcheck` table with:
     - `check_id`: Auto-incrementing primary key
     - `datetime`: Timestamp of when the health check was performed

## Important Implementation Details

1. **Database Bootstrapping**:
   - The application automatically creates the required database tables at startup
   - No manual SQL scripts need to be run

2. **Error Handling**:
   - The health check endpoint properly handles database connection failures
   - Appropriate HTTP status codes are returned for different scenarios

3. **HTTP Headers**:
   - All responses include cache-control headers to prevent caching
   - The application follows RESTful API principles

## GitHub Workflow

1. Create a GitHub organization
2. Create a repository named `webapp` in the organization
3. Fork the repository to your personal GitHub account
4. Clone your forked repository locally
5. Create a branch for each feature/fix
6. Make changes in your branch
7. Push changes to your fork
8. Create a pull request from your fork to the organization repository

## Best Practices

1. Follow the GitHub workflow described above
2. Don't commit sensitive information like database credentials
3. Use appropriate `.gitignore` to exclude node_modules, build artifacts, etc.
4. Write descriptive commit messages
5. Test your API before submitting a pull request

## Testing the API

You can test the health check API using curl:

```bash
# Test successful health check
curl -vvvv http://localhost:3000/healthz

# Test with invalid method
curl -vvvv -XPOST http://localhost:3000/healthz

# Test with payload (should fail)
curl -vvvv -d "data=test" http://localhost:3000/healthz
```

## Troubleshooting

If you encounter issues:

1. **Database Connection Failed**:
   - Check if MySQL is running
   - Verify the credentials in your `.env` file
   - Make sure the database exists

2. **Server Won't Start**:
   - Check for errors in the console
   - Make sure all required files are present
   - Ensure port 3000 (or your configured port) is available

3. **Getting 503 Responses**:
   - This means the database connection is failing
   - Check MySQL status and configuration