# Payment-processor Lambda Terraform - Variables

variable "ecr_payment_processor_image_uri" {
  description = "ECR image URI for the payment-processor Lambda"
  type        = string
}

variable "stripe_secret_key" {
  description = "Stripe secret key (pass via CI secrets)"
  type        = string
  default     = ""
  sensitive   = true
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
