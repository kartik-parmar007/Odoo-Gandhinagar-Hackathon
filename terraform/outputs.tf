output "ec2_public_ip" {
  description = "The Public IP of the EC2 Server"
  value       = aws_instance.web_server.public_ip
}

output "ecr_repository_url" {
  description = "The registry URL for the AWS Elastic Container Registry"
  value       = aws_ecr_repository.app_repo.repository_url
}
