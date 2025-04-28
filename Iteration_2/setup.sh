#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Step 1: Update package lists
echo "Updating package lists..."
sudo apt-get update

# Step 2: Upgrade packages
echo "Upgrading packages..."
sudo apt-get upgrade -y

# Step 3: Install necessary utilities
echo "Installing necessary utilities..."
sudo apt-get install -y unzip nodejs npm

# Step 4: Install MySQL
echo "Installing MySQL..."
sudo apt-get install -y mysql-server

# Step 5: Create database
echo "Creating database..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS CloudCourse;"

echo "Creating database user..."
sudo mysql -e "CREATE USER IF NOT EXISTS 'cloudcourse_user'@'localhost' IDENTIFIED BY 'password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON CloudCourse.* TO 'cloudcourse_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
# Step 6: Create application group
echo "Creating application group..."
sudo groupadd -f CloudCourse_app

# Step 7: Create application user
echo "Creating application user..."
sudo useradd -m -g CloudCourse_app CloudCourse_user

# Step 8: Set up application directory
echo "Setting up application directory..."
sudo mkdir -p /opt/CloudCourse
sudo unzip -o app.zip -d /opt/CloudCourse/

# Step 9: Install dependencies
echo "Installing Node.js dependencies..."
(cd /opt/CloudCourse && sudo npm install)

# Step 10: Update permissions
echo "Updating permissions..."
sudo chown -R CloudCourse_user:CloudCourse_app /opt/CloudCourse
sudo chmod -R 750 /opt/CloudCourse

# Step 11: Create users table if needed
echo "Creating users table if it doesn't exist..."
sudo mysql -e "USE CloudCourse; CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE
);"

echo "Setup completed successfully!"