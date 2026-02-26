terraform {
  required_version = ">= 1.12.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.31.0"
    }
  }

  backend "s3" {
    # bucket, key, region, use_lockfile passed via -backend-config in CI
  }
}
