# Notification-sender Lambda Terraform - Variables

variable "ecr_notification_sender_image_uri" {
  description = "ECR image URI for the notification-sender Lambda"
  type        = string
}

variable "ses_sender_email" {
  description = "SES verified sender email address"
  type        = string
  default     = "noreply@eventpro.com"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "timeout_seconds" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 60
}

variable "memory_size_mb" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
}

variable "log_retention_in_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "batch_size" {
  description = "Maximum number of SQS records per Lambda invocation"
  type        = number
  default     = 10
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default = {
    Project   = "eventpro"
    ManagedBy = "terraform"
  }
}
