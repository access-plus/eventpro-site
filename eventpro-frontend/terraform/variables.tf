variable "domain_name" {
  description = "Domain (e.g., example.com)"
  type        = string
}

variable "backend_bucket" {
  description = "S3 bucket for Terraform state"
  type        = string
  default     = "eventpro-site-state"
}

variable "backend_key_services" {
  description = "State key for services Terraform"
  type        = string
  default     = "services/terraform.tfstate"
}

variable "backend_region_services" {
  description = "AWS region of the services Terraform state bucket"
  type        = string
  default     = "us-east-1"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default = {
    Project   = "eventpro"
    ManagedBy = "terraform"
  }
}
