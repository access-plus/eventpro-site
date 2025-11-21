provider "aws" {
  access_key                  = "test"
  secret_key                  = "test"
  region                      = "us-east-1"
  s3_use_path_style           = true
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    s3 = "http://localhost.localstack.cloud:4566"
    # apigateway  = "http://localhost.localstack.cloud:4566"
    # ec2         = "http://localhost.localstack.cloud:4566"
    # lambda      = "http://localhost.localstack.cloud:4566"
    rds         = "http://localhost.localstack.cloud:4566"
    eventbridge = "http://localhost.localstack.cloud:4566"
    cloudwatch  = "http://localhost.localstack.cloud:4566"
    ecr         = "http://localhost.localstack.cloud:4566"
    # dynamodb    = "http://localhost.localstack.cloud:4566"
    iam = "http://localhost.localstack.cloud:4566"
    sqs = "http://localhost.localstack.cloud:4566"
    sns = "http://localhost.localstack.cloud:4566"
    # eks         = "http://localhost.localstack.cloud:4566"
    ecs = "http://localhost.localstack.cloud:4566"
    sts = "http://localhost.localstack.cloud:4566"
    # cognito-idp endpoint not needed - Cognito requires LocalStack Pro
    # If using Pro, uncomment and use: cognitoidentityprovider = "http://localhost.localstack.cloud:4566"
    secretsmanager = "http://localhost.localstack.cloud:4566"
    # Add more resources as needed for other services
  }
}