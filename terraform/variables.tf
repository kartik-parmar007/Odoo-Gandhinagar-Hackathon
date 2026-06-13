variable "aws_region" {
  description = "AWS Region to deploy resources into"
  type        = string
  default     = "us-east-1"
}

variable "key_name" {
  description = "The name of the SSH Key Pair to use for the EC2 Instance (must be created manually in AWS Console)"
  type        = string
  default     = "devops-key"
}

variable "ami_id" {
  description = "Ubuntu Server 22.04 LTS AMI ID (defaults to us-east-1 AMI)"
  type        = string
  default     = "ami-0c7217cdde317cfec" # Standard Ubuntu 22.04 LTS AMI for us-east-1 (verify current ID when deploying)
}
