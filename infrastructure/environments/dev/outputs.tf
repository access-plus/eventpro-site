# Dev Environment - Outputs

# AWS Region Output
output "aws_region" {
  description = "AWS region for resources"
  value       = var.aws_region
}

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

# RDS Outputs
output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "db_name" {
  description = "Database name"
  value       = module.rds.db_instance_name
}

# ALB Outputs
output "alb_dns_name" {
  description = "DNS name of the ALB"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the ALB"
  value       = module.alb.alb_zone_id
}

# CloudFront Outputs
output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = module.cloudfront.distribution_domain_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = module.cloudfront.distribution_id
}

# S3 Outputs
output "images_bucket_name" {
  description = "Name of the images S3 bucket"
  value       = module.s3_images.bucket_id
}

output "frontend_bucket_name" {
  description = "Name of the frontend S3 bucket"
  value       = module.s3_frontend.bucket_id
}

# Cognito Outputs
output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  value       = module.cognito.user_pool_arn
}

output "cognito_client_id" {
  description = "ID of the Cognito User Pool Client"
  value       = module.cognito.user_pool_client_id
}

output "cognito_domain_name" {
  description = "Domain name of the Cognito User Pool"
  value       = module.cognito.user_pool_domain_name
}

# Secrets Manager Outputs removed
# Database secret ARN is available via module.rds.db_master_user_secret_arn (RDS-managed)
# Stripe secrets are passed as environment variables, not via Secrets Manager

# Route53 Outputs
output "frontend_fqdn" {
  description = "Fully qualified domain name for frontend"
  value       = module.route53.record_fqdns["frontend"]
}

output "api_fqdn" {
  description = "Fully qualified domain name for API"
  value       = module.route53.record_fqdns["api"]
}

# ECS Outputs
output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = module.ecs_eventpro_api.cluster_id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs_eventpro_api.cluster_name
}

output "ecs_service_name" {
  description = "Name of the EventPro API ECS service"
  value       = module.ecs_eventpro_api.service_name
}

output "ecs_service_arn" {
  description = "ARN of the EventPro API ECS service"
  value       = module.ecs_eventpro_api.service_arn
}

# SQS Queue Outputs
output "sqs_order_queue_url" {
  description = "SQS Order Queue URL"
  value       = module.sqs_order.queue_url
}

output "sqs_payment_queue_url" {
  description = "SQS Payment Queue URL"
  value       = module.sqs_payment.queue_url
}

output "sqs_notification_queue_url" {
  description = "SQS Notification Queue URL"
  value       = module.sqs_notification.queue_url
}

