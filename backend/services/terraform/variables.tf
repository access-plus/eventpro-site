# Services Terraform - Variables
# Resource names use terraform.workspace prefix

variable "image_registry" {
  description = "Container image registry hostname (e.g. 123456789012.dkr.ecr.us-east-1.amazonaws.com)"
  type        = string
}

variable "image_name" {
  description = "Container image name/repository (e.g. eventpro-api)"
  type        = string
}

variable "image_tag" {
  description = "Container image tag (e.g. git SHA or latest)"
  type        = string
}

variable "domain_name" {
  description = "Domain for Route53 (e.g., example.com). Hosted zone must exist in account."
  type        = string
}

variable "cloudfront_certificate_arn" {
  description = "ACM certificate ARN for CloudFront (us-east-1). Create manually for *.domain_name."
  type        = string
  default     = ""
}

variable "alb_certificate_arn" {
  description = "ACM certificate ARN for ALB. Create manually for *.domain_name (in ALB region)."
  type        = string
  default     = ""
}

variable "aws_region" {
  description = "AWS region to deploy resources into"
  type        = string
  default     = "us-east-1"
}

# RDS
variable "db_name" {
  description = "Database name"
  type        = string
  default     = "eventprodb"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "16"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Max allocated storage for autoscaling"
  type        = number
  default     = 100
}

variable "db_storage_type" {
  description = "Storage type"
  type        = string
  default     = "gp3"
}

variable "db_multi_az" {
  description = "Enable Multi-AZ"
  type        = bool
  default     = false
}

variable "db_backup_retention_period" {
  description = "Backup retention in days"
  type        = number
  default     = 7
}

variable "db_backup_window" {
  description = "Backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "Maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "db_auto_minor_version_upgrade" {
  description = "Auto minor version upgrade"
  type        = bool
  default     = true
}

variable "db_monitoring_interval" {
  description = "Enhanced monitoring interval (0 to disable)"
  type        = number
  default     = 0
}

variable "db_performance_insights_enabled" {
  description = "Enable Performance Insights"
  type        = bool
  default     = false
}

variable "db_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

# S3
variable "images_bucket_name" {
  description = "Optional explicit S3 bucket name for uploaded images. Leave empty to use a globally unique default name."
  type        = string
  default     = ""
}

# SQS
variable "order_queue_visibility_timeout_seconds" {
  description = "Order queue visibility timeout in seconds (match/ exceed order-processor Lambda timeout)"
  type        = number
  default     = 60
}

variable "payment_queue_visibility_timeout_seconds" {
  description = "Payment queue visibility timeout in seconds (match/ exceed payment-processor Lambda timeout)"
  type        = number
  default     = 60
}

variable "notification_queue_visibility_timeout_seconds" {
  description = "Notification queue visibility timeout in seconds (match/ exceed notification-sender Lambda timeout)"
  type        = number
  default     = 60
}

# ECS
variable "ecs_container_port" {
  description = "Container port"
  type        = number
  default     = 8080
}

variable "ecs_task_cpu" {
  description = "Task CPU units (1024 = 1 vCPU)"
  type        = number
  default     = 1024
}

variable "ecs_task_memory" {
  description = "Task memory in MiB"
  type        = number
  default     = 2048
}

variable "ecs_desired_count" {
  description = "Desired task count"
  type        = number
  default     = 2
}

variable "ecs_enable_auto_scaling" {
  description = "Enable auto-scaling"
  type        = bool
  default     = true
}

variable "ecs_autoscaling_min_capacity" {
  description = "Min capacity"
  type        = number
  default     = 2
}

variable "ecs_autoscaling_max_capacity" {
  description = "Max capacity"
  type        = number
  default     = 10
}

variable "ecs_autoscaling_cpu_target_value" {
  description = "Target CPU utilization %"
  type        = number
  default     = 70
}

variable "ecs_autoscaling_memory_target_value" {
  description = "Target memory utilization %"
  type        = number
  default     = null
}

variable "ecs_log_retention_days" {
  description = "CloudWatch log retention"
  type        = number
  default     = 7
}

variable "ecs_container_insights" {
  description = "Enable Container Insights"
  type        = bool
  default     = false
}

variable "ecs_enable_execute_command" {
  description = "Enable ECS Exec"
  type        = bool
  default     = false
}

# ALB
variable "alb_internal" {
  description = "Internal ALB"
  type        = bool
  default     = false
}

variable "alb_enable_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

# Application secrets (sensitive - pass via CI secrets)
variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "stripe_publishable_key" {
  description = "Stripe publishable key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "jwt_issuer" {
  description = "JWT issuer"
  type        = string
  default     = "eventpro"
}

variable "jwt_access_ttl_seconds" {
  description = "JWT access TTL"
  type        = number
  default     = 3600
}

variable "jwt_public_key" {
  description = "JWT public key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "jwt_private_key" {
  description = "JWT private key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default = {
    Project   = "eventpro"
    ManagedBy = "terraform"
  }
}
