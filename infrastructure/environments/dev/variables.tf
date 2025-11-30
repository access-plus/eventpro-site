# Dev Environment Variables

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "name_prefix" {
  description = "Prefix for all resource names"
  type        = string
  default     = "eventpro-dev"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

# Route53 Configuration
variable "route53_zone_name" {
  description = "Name of the Route53 hosted zone (e.g., example.com.)"
  type        = string
}

variable "route53_private_zone" {
  description = "Whether the hosted zone is private"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Base domain name (e.g., example.com)"
  type        = string
}

variable "frontend_subdomain" {
  description = "Subdomain for frontend (e.g., app)"
  type        = string
  default     = "app"
}

variable "api_subdomain" {
  description = "Subdomain for API (e.g., api)"
  type        = string
  default     = "api"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# RDS Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
  default     = "eventpro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "eventprodb"
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment for RDS (false for dev)"
  type        = bool
  default     = false
}

# ECS Configuration
variable "eventpro_api_image" {
  description = "Docker image for EventPro API (modular monolith)"
  type        = string
  default     = "eventpro-api:latest"
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_task_cpu" {
  description = "CPU units for ECS task (1024 = 1 vCPU)"
  type        = number
  default     = 1024
}

variable "ecs_task_memory" {
  description = "Memory (MB) for ECS task"
  type        = number
  default     = 2048
}

variable "ecs_enable_auto_scaling" {
  description = "Enable auto-scaling for ECS service"
  type        = bool
  default     = true
}

variable "ecs_autoscaling_min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_autoscaling_max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 10
}

variable "ecs_autoscaling_cpu_target_value" {
  description = "Target CPU utilization percentage for auto-scaling"
  type        = number
  default     = 70.0
}

variable "ecs_autoscaling_memory_target_value" {
  description = "Target memory utilization percentage for auto-scaling"
  type        = number
  default     = 80.0
}

# ALB Configuration
variable "alb_certificate_arn" {
  description = "ARN of the ACM certificate for HTTPS listener"
  type        = string
  default     = null
}

variable "alb_internal" {
  description = "Whether the ALB is internal"
  type        = bool
  default     = false
}

# CloudFront Configuration
variable "cloudfront_certificate_arn" {
  description = "ARN of the ACM certificate for CloudFront (must be in us-east-1)"
  type        = string
  default     = null
}

# Cognito Configuration
variable "cognito_domain" {
  description = "Domain prefix for Cognito User Pool (e.g., eventpro-dev-auth)"
  type        = string
  default     = null
}

variable "cognito_certificate_arn" {
  description = "ARN of the ACM certificate for Cognito custom domain (must be in us-east-1)"
  type        = string
  default     = null
}

# Secrets Manager Configuration
variable "stripe_webhook_secret" {
  description = "Stripe webhook secret for webhook verification"
  type        = string
  default     = ""
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key for payment processing"
  type        = string
  sensitive   = true
  default     = ""
}

variable "stripe_publishable_key" {
  description = "Stripe publishable key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "jwt_secret" {
  description = "JWT secret key for token signing"
  type        = string
  sensitive   = true
  default     = ""
}

# Tags
variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "dev"
    Project     = "eventpro"
    ManagedBy   = "terraform"
  }
}

# Analytics Service Lambda (Optional - remains as serverless)
variable "analytics_service_image" {
  description = "Docker image for Analytics Service Lambda (optional)"
  type        = string
  default     = null
}

# Secret Rotation Lambda
variable "secret_rotation_lambda_image" {
  description = "Docker image URI for secret rotation Lambda function"
  type        = string
  default     = ""
}

# Order Processor Lambda
variable "order_processor_lambda_image" {
  description = "Docker image URI for order processor Lambda function"
  type        = string
  default     = ""
}

# Payment Processor Lambda
variable "payment_processor_lambda_image" {
  description = "Docker image URI for payment processor Lambda function"
  type        = string
  default     = ""
}

# Notification Sender Lambda
variable "notification_sender_lambda_image" {
  description = "Docker image URI for notification sender Lambda function"
  type        = string
  default     = ""
}

# SES Configuration
variable "ses_sender_email" {
  description = "SES sender email address for notifications"
  type        = string
  default     = "noreply@eventpro.com"
}
