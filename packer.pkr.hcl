packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.8"
      source  = "github.com/hashicorp/amazon"
    }
    # googlecompute = {
    #   source  = "github.com/hashicorp/googlecompute"
    #   version = ">= 1.0.0"
    # }
  }
}

variable "aws_profile" {
  type        = string
  description = "AWS profile to use for the AWS provider"
  default     = "UserDev"
}

variable "aws_region" {
  default = "us-east-1"
}

variable "artifact_path" {
  default = "webapp.zip"
}

variable "vpc_to_use" {
  type        = string
  description = "VPC to use for the AWS provider"
}

variable "subnet_to_use" {
  type        = string
  description = "Subnet to use within the VPC"
}

variable "source_ami" {
  type        = string
  description = "Source AMI ID"
  default     = "ami-0866a3c8686eaeeba"
}

variable "db_user" {}
variable "db_pass" {}
variable "db_root_pass" {}
variable "ami_name" {}


variable "gcp_project_id" {
  default = "gold-stone-451619-j7"
}

variable "gcp_zone" {
  default = "us-east1-b"
}

variable "disk_size" {
  default = 100
}

variable "gcp_machine_type" {
  default = "e2-medium"
}

variable "gcp_source_image" {
  default = "ubuntu-2404-lts-amd64"
}

variable "network" {
  default = "default"
}

variable "gcp_ssh_username" {
  default = "ubuntu"
}

source "amazon-ebs" "ubuntu" {
  ami_name      = var.ami_name
  instance_type = "t2.micro"
  region        = var.aws_region


  source_ami = var.source_ami


  associate_public_ip_address = true
  vpc_id                      = var.vpc_to_use
  subnet_id                   = var.subnet_to_use
  ssh_username                = "ubuntu"
  profile                     = var.aws_profile


}

# GCP Machine Image Source Configuration
# source "googlecompute" "gcp_image" {
#   project_id            = var.gcp_project_id
#   source_image_family   = "ubuntu-2404-lts-amd64"
#   image_name            = "csye6225-${formatdate("YYYY-MM-DD-hh-mm-ss", timestamp())}"
#   zone                  = var.gcp_zone
#   disk_size             = var.disk_size
#   network               = var.network
#   communicator          = "ssh"
#   ssh_username          = var.gcp_ssh_username
#   service_account_email = "github-actions@gold-stone-451619-j7.iam.gserviceaccount.com"
#   tags                  = ["default-allow-ssh"]
# }

build {
  sources = ["source.amazon-ebs.ubuntu" /*, "source.googlecompute.gcp_image"*/]

  provisioner "shell" {
    inline = [
      "export DEBIAN_FRONTEND=noninteractive",
      "sudo apt update -y",
      "sudo apt install -y wget",
      "wget https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb",
      "sudo dpkg -i amazon-cloudwatch-agent.deb",
      "sudo systemctl enable amazon-cloudwatch-agent",
      "sudo apt install -y nodejs npm",


      # Create the local user
      "sudo useradd -r -s /usr/sbin/nologin csye6225",

      # Create the application directory
      "sudo mkdir -p /var/www/webapp",
      "sudo chown -R csye6225:csye6225 /var/www/webapp",

      # Create log directories
      "sudo mkdir -p /var/log/webapp",
      "sudo chown -R csye6225:csye6225 /var/log/webapp",
      "sudo chmod 755 /var/log/webapp"
    ]
  }

  # ✅ Copy the webapp artifact from GitHub Actions
  provisioner "file" {
    source      = var.artifact_path
    destination = "/tmp/webapp.zip"
  }

  provisioner "shell" {
    inline = [
      "sudo apt install -y unzip",
      "sudo unzip /tmp/webapp.zip -d /var/www/webapp",
      "cd /var/www/webapp && sudo npm install"

    ]
  }

  # ✅ Copy the systemd service file from the repo
  provisioner "file" {
    source      = "webapp.service" # Ensure this file exists in the repo
    destination = "/tmp/webapp.service"
  }

  provisioner "shell" {
    inline = [
      "sudo mv /tmp/webapp.service /etc/systemd/system/webapp.service", # ✅ Move with sudo
      "sudo chmod 644 /etc/systemd/system/webapp.service",              # ✅ Correct permissions
      "sudo systemctl daemon-reload",
      "sudo systemctl enable webapp",
      "echo '⚠️ Skipping webapp start in Packer. Terraform will start it later.'",

      # ✅ Validate if service is running
      "if [ -f /etc/systemd/system/webapp.service ]; then echo '✅ webapp.service is successfully placed'; else echo '❌ webapp.service is missing'; exit 1; fi",
      "ls -l /etc/systemd/system/webapp.service" # ✅ Log file details for GitHub Actions output
    ]
  }
}
