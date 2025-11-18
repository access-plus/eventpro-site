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

variable "core_api_subdomain" {
  description = "Subdomain for core API (e.g., api)"
  type        = string
  default     = "api"
}

variable "event_api_subdomain" {
  description = "Subdomain for event API (e.g., events)"
  type        = string
  default     = "events"
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
variable "ecs_container_image" {
  description = "Docker image for ECS containers"
  type        = string
  default     = "eventpro/core-api:latest"
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1
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

variable "order_processor_image" {
  description = "Image for order processor"
  type        = string
}

variable "payment_processor_image" {
  description = "Image for payment processor"
  type        = string
}

variable "notification_sender_image" {
  description = "Image for notification sender"
  type        = string
}

variable "analytics_service_image" {
  description = "Image for analytics service"
  type        = string
}

variable "core_api_image" {
  description = "Docker image for Core API ECS container"
  type        = string
}

variable "event_api_image" {
  description = "Docker image for Event API ECS container"
  type        = string
}
