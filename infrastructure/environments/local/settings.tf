terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.21.0"
    }
  }

  backend "local" {
    path = "terraform.tfstate"
  }
}

# Provider for LocalStack resources (S3, SQS, Secrets Manager, etc.)
provider "aws" {
  alias                       = "localstack"
  access_key                  = "test"
  secret_key                  = "test"
  region                      = "us-east-1"
  s3_use_path_style           = true
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    s3             = "http://localhost.localstack.cloud:4566"
    apigateway     = "http://localhost.localstack.cloud:4566"
    lambda         = "http://localhost.localstack.cloud:4566"
    rds            = "http://localhost.localstack.cloud:4566"
    eventbridge    = "http://localhost.localstack.cloud:4566"
    cloudwatch     = "http://localhost.localstack.cloud:4566"
    logs           = "http://localhost.localstack.cloud:4566"
    ecr            = "http://localhost.localstack.cloud:4566"
    dynamodb       = "http://localhost.localstack.cloud:4566"
    iam            = "http://localhost.localstack.cloud:4566"
    sqs            = "http://localhost.localstack.cloud:4566"
    sns            = "http://localhost.localstack.cloud:4566"
    ses            = "http://localhost.localstack.cloud:4566"
    ecs            = "http://localhost.localstack.cloud:4566"
    sts            = "http://localhost.localstack.cloud:4566"
    secretsmanager = "http://localhost.localstack.cloud:4566"
    # Add more resources as needed for other services
  }
}

# Provider for real AWS resources (Cognito)
# Uses default AWS credentials from environment variables or ~/.aws/credentials
provider "aws" {
  alias  = "aws"
  region = "us-east-1"
  # Credentials are read from:
  # 1. AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables
  # 2. ~/.aws/credentials file
  # 3. IAM role (if running on EC2/ECS)
}