# Order-processor Lambda Terraform - Phase 3
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
# Must use same workspace as services (e.g. dev) so we read correct env state
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
  name              = "/aws/lambda/${local.name_prefix}-order-processor"
  retention_in_days = var.log_retention_in_days

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-order-processor-logs" })
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name = "${local.name_prefix}-order-processor-lambda-role"

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

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-order-processor-lambda-role" })
}

# IAM Policy: SQS receive (order queue), send (payment queue)
resource "aws_iam_role_policy" "sqs" {
  name = "${local.name_prefix}-order-processor-sqs-policy"
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
          data.terraform_remote_state.services.outputs.order_queue_arn,
          data.terraform_remote_state.services.outputs.payment_queue_arn
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:SendMessage"]
        Resource = data.terraform_remote_state.services.outputs.payment_queue_arn
      }
    ]
  })
}

# IAM Policy: VPC (ENI for RDS access)
resource "aws_iam_role_policy" "vpc" {
  name = "${local.name_prefix}-order-processor-vpc-policy"
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
  name = "${local.name_prefix}-order-processor-logs-policy"
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
  name = "${local.name_prefix}-order-processor-secrets-policy"
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
resource "aws_lambda_function" "order_processor" {
  function_name = "${local.name_prefix}-order-processor"
  description   = "Processes orders from SQS, validates them, reserves tickets, and publishes to payment queue"
  role          = aws_iam_role.lambda.arn
  timeout       = var.timeout_seconds
  memory_size   = var.memory_size_mb

  package_type  = "Image"
  image_uri     = local.image_uri
  architectures = [var.lambda_architecture]

  environment {
    variables = {
      DB_HOST               = data.terraform_remote_state.services.outputs.rds_endpoint
      DB_PORT               = tostring(data.terraform_remote_state.services.outputs.rds_port)
      DB_NAME               = data.terraform_remote_state.services.outputs.rds_name
      DB_SECRET_ARN         = data.terraform_remote_state.services.outputs.db_master_user_secret_arn
      SQS_PAYMENT_QUEUE_URL = data.terraform_remote_state.services.outputs.payment_queue_url
      # AWS_REGION is reserved; Lambda injects it automatically — do not set here.
      spring_cloud_function_definition = "processOrder"
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

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-order-processor" })
}

# SQS Event Source Mapping (order queue -> Lambda)
resource "aws_lambda_event_source_mapping" "order_queue" {
  event_source_arn = data.terraform_remote_state.services.outputs.order_queue_arn
  function_name    = aws_lambda_function.order_processor.arn
  enabled          = true

  batch_size                         = var.batch_size
  maximum_batching_window_in_seconds = 5

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-order-processor-event-source" })
}
