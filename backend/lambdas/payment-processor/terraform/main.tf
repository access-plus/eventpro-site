# Payment-processor Lambda Terraform - Phase 4
# Lambda (container image), IAM, SQS event source mapping
# Uses terraform_remote_state from services for DB/queue outputs

locals {
  workspace   = terraform.workspace
  name_prefix = local.workspace
  image_uri   = "${var.image_registry}/${var.image_name}:${var.image_tag}"
  common_tags = merge(var.tags, { Env = local.workspace })
}

provider "aws" {
  region = var.aws_region
}

# Remote state from services (DB, queues, VPC)
data "terraform_remote_state" "services" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket = var.services_state_bucket
    key    = var.services_state_key
    region = var.services_state_region
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.name_prefix}-payment-processor"
  retention_in_days = var.log_retention_in_days

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-payment-processor-logs" })
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name = "${local.name_prefix}-payment-processor-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-payment-processor-lambda-role" })
}

# IAM Policy: SQS receive (payment queue), send (notification queue)
resource "aws_iam_role_policy" "sqs" {
  name = "${local.name_prefix}-payment-processor-sqs-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl"
        ]
        Resource = [
          data.terraform_remote_state.services.outputs.payment_queue_arn,
          data.terraform_remote_state.services.outputs.notification_queue_arn
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:SendMessage"]
        Resource = data.terraform_remote_state.services.outputs.notification_queue_arn
      }
    ]
  })
}

# IAM Policy: VPC (ENI for RDS access)
resource "aws_iam_role_policy" "vpc" {
  name = "${local.name_prefix}-payment-processor-vpc-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Policy: CloudWatch Logs
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name = "${local.name_prefix}-payment-processor-logs-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.lambda.arn}:*"
      }
    ]
  })
}

# IAM Policy: Secrets Manager (RDS credentials)
resource "aws_iam_role_policy" "secrets_manager" {
  name = "${local.name_prefix}-payment-processor-secrets-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = data.terraform_remote_state.services.outputs.db_master_user_secret_arn
      }
    ]
  })
}

# Lambda Function (Spring Boot container image)
resource "aws_lambda_function" "payment_processor" {
  function_name = "${local.name_prefix}-payment-processor"
  description   = "Processes payments from SQS, confirms Stripe, updates order, publishes to notification queue"
  role          = aws_iam_role.lambda.arn
  timeout       = var.timeout_seconds
  memory_size   = var.memory_size_mb

  package_type = "Image"
  image_uri    = local.image_uri

  environment {
    variables = {
      DB_HOST                          = data.terraform_remote_state.services.outputs.rds_endpoint
      DB_PORT                          = tostring(data.terraform_remote_state.services.outputs.rds_port)
      DB_NAME                          = data.terraform_remote_state.services.outputs.rds_name
      DB_SECRET_ARN                    = data.terraform_remote_state.services.outputs.db_master_user_secret_arn
      SQS_NOTIFICATION_QUEUE_URL       = data.terraform_remote_state.services.outputs.notification_queue_url
      AWS_REGION                       = var.aws_region
      spring_cloud_function_definition = "processPayment"
      STRIPE_SECRET_KEY                = var.stripe_secret_key
    }
  }

  vpc_config {
    subnet_ids         = data.terraform_remote_state.services.outputs.lambda_subnet_ids
    security_group_ids = [data.terraform_remote_state.services.outputs.ecs_security_group_id]
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy.cloudwatch_logs
  ]

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-payment-processor" })
}

# SQS Event Source Mapping (payment queue -> Lambda)
resource "aws_lambda_event_source_mapping" "payment_queue" {
  event_source_arn = data.terraform_remote_state.services.outputs.payment_queue_arn
  function_name    = aws_lambda_function.payment_processor.arn
  enabled          = true

  batch_size                         = var.batch_size
  maximum_batching_window_in_seconds = 5

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-payment-processor-event-source" })
}
