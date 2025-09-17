**WEB APP**

A scalable User Management Service built with Node.js and Express.js, supporting CRD operation. The infrastructure is deployed on AWS, provisioned using Terraform.

**Features**

User Management: Provides complete CRD functionality for managing user information.
Health Monitoring: Includes a dedicated endpoint to monitor the application’s health and its connected services.
Secure Deployment: Ensures data protection through HTTPS using SSL certificates and customer-managed encryption keys.
Scalability and Reliability: Achieves high availability and scalability using managed instance groups and load balancers.

**Technologies used:**

Programming Language: JavaScript
Relational Database: MySQL
Backend Framework: Node.js, Express.js
ORM Framework: Sequelize

**To run the packer build command**

Create variables.pkrvars.hcl file with the following fields:

* aws_profile    = ""
* vpc_default    = ""
* subnet_default = ""
* artifact_path  = ""
* ami_name       = ""
* instance_type  = ""
* region         = ""

* db_user     = ""
* db_password = "" 
* db_name     = ""

* source_ami_id   = ""
* demo_account_id = ""

**Terraform Repository**

* Repository - https://github.com/chintaabhinav/Terraform-CloudNativeApplication *

**SSL Certificate Import – Demo Environment**

For the Demo environment, SSL certificates are not issued using AWS Certificate Manager. Instead, a third-party certificate provider (such as ZeroSSL) is used. The certificate must be manually imported into AWS ACM before deploying the infrastructure.

**Steps to Import SSL Certificate to ACM**

1. After downloading the certificate from ZeroSSL or another provider, make sure you have the following files:
  * certificate.crt (the actual certificate)
  * private.key (your private key)
  * ca_bundle.crt (the CA bundle / intermediate certificates)

2. Use the following AWS CLI command to import the certificate:
   
   aws acm import-certificate \
  --certificate fileb://certificate.crt \
  --private-key fileb://private.key \
  --certificate-chain fileb://ca_bundle.crt \
  --region us-east-1

3. Once the certificate is imported, note the Certificate ARN from the output.

4. Add this ARN to your terraform.tfvars:

  demo_certificate_arn = "arn:aws:acm:us-east-1:XXXXXXXXXXXX:certificate/your-cert-id"

5. Terraform will automatically use this ARN when the profile is set to "Demo-User".


**To run the app locally:**

**Pre-requisites**

* Install latest Node.js. Verify the versions using below commands:
  * node -v
  * npm -v
* Install latest MySQL (To run the app locally)  
  
**Installation**

* Clone the repository using git command: git clone git@github.com:CSYE-6225Spring-2025/webapp.git
* Navigate to webapp directory using git CLI (git bash): cd webapp
* Install dependencies (dotenv, express, sequelize) using git command: npm install
* Create .env file and set below paramaters:
    * DB_NAME=<database_name>
    * DB_USER=<your_db_username>
    * DB_PASS=<your_db_password>
    * DB_HOST=localhost
    * DB_DIALECT=mysql
  
* Run the app using command: node index.js


