# Order-processor Lambda Terraform - Variables

variable "image_registry" {
  description = "Container image registry hostname (e.g. 123456789012.dkr.ecr.us-east-1.amazonaws.com)"
  type        = string
}

variable "image_name" {
  description = "Container image name/repository (e.g. eventpro-order-processor)"
  type        = string
}

variable "image_tag" {
  description = "Container image tag (e.g. git SHA or latest)"
  type        = string
}

variable "lambda_architecture" {
  description = "Lambda instruction set architecture that matches the container image"
  type        = string
  default     = "x86_64"

  validation {
    condition     = contains(["x86_64", "arm64"], var.lambda_architecture)
    error_message = "lambda_architecture must be x86_64 or arm64."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "services_state_bucket" {
  description = "S3 bucket containing the services Terraform state"
  type        = string
  default     = "eventpro-site-state"
}

variable "services_state_key" {
  description = "Key for the services Terraform state file"
  type        = string
  default     = "services/terraform.tfstate"
}

variable "services_state_region" {
  description = "AWS region of the services Terraform state bucket"
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
