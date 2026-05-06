# Notification-sender Lambda Terraform - Variables

variable "image_registry" {
  description = "Container image registry hostname (e.g. 123456789012.dkr.ecr.us-east-1.amazonaws.com)"
  type        = string
}

variable "image_name" {
  description = "Container image name/repository (e.g. eventpro-notification-sender)"
  type        = string
}

variable "image_tag" {
  description = "Container image tag (e.g. git SHA or latest)"
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

variable "use_localstack" {
  description = "Route AWS provider calls to LocalStack endpoints"
  type        = bool
  default     = false
}

variable "localstack_endpoint" {
  description = "LocalStack endpoint used when use_localstack is true"
  type        = string
  default     = "http://localhost:4566"
}

variable "localstack_runtime_endpoint" {
  description = "LocalStack endpoint visible from Lambda runtime containers"
  type        = string
  default     = "http://host.docker.internal:4566"
}

variable "shared_infra_state_bucket" {
  description = "S3 bucket containing the shared infrastructure Terraform state"
  type        = string
  default     = "eventpro-site-state"
}

variable "shared_infra_state_key" {
  description = "Key for the shared infrastructure Terraform state file"
  type        = string
  default     = "shared-infra/terraform.tfstate"
}

variable "shared_infra_state_region" {
  description = "AWS region of the shared infrastructure Terraform state bucket"
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
