# Notification-sender Lambda Terraform - Phase 5
# Lambda (container image), IAM, SQS event source mapping
# No VPC - uses SES/SNS (public AWS APIs); no RDS

locals {
  workspace   = terraform.workspace
  name_prefix = local.workspace
  image_uri   = "${var.image_registry}/${var.image_name}:${var.image_tag}"
  common_tags = merge(var.tags, { Env = local.workspace })
}

provider "aws" {
  region = var.aws_region
}

# Remote state from services (queues)
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
  name              = "/aws/lambda/${local.name_prefix}-notification-sender"
  retention_in_days = var.log_retention_in_days

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-notification-sender-logs" })
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name = "${local.name_prefix}-notification-sender-lambda-role"

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

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-notification-sender-lambda-role" })
}

# IAM Policy: SQS receive (notification queue)
resource "aws_iam_role_policy" "sqs" {
  name = "${local.name_prefix}-notification-sender-sqs-policy"
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
        Resource = data.terraform_remote_state.services.outputs.notification_queue_arn
      }
    ]
  })
}

# IAM Policy: SES send email
resource "aws_iam_role_policy" "ses" {
  name = "${local.name_prefix}-notification-sender-ses-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = "*"
      }
    ]
  })
}

# IAM Policy: SNS publish (SMS)
resource "aws_iam_role_policy" "sns" {
  name = "${local.name_prefix}-notification-sender-sns-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = "*"
      }
    ]
  })
}

# IAM Policy: CloudWatch Logs
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name = "${local.name_prefix}-notification-sender-logs-policy"
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

# Lambda Function (Spring Boot container image) - no VPC for faster cold starts
resource "aws_lambda_function" "notification_sender" {
  function_name = "${local.name_prefix}-notification-sender"
  description   = "Sends notifications from SQS via SES (email) and SNS (SMS)"
  role          = aws_iam_role.lambda.arn
  timeout       = var.timeout_seconds
  memory_size   = var.memory_size_mb

  package_type  = "Image"
  image_uri     = local.image_uri
  architectures = [var.lambda_architecture]

  environment {
    variables = {
      # AWS_REGION is reserved; Lambda injects it automatically — do not set here.
      SES_SENDER_EMAIL                 = var.ses_sender_email
      spring_cloud_function_definition = "sendNotification"
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy.cloudwatch_logs
  ]

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-notification-sender" })
}

# SQS Event Source Mapping (notification queue -> Lambda)
resource "aws_lambda_event_source_mapping" "notification_queue" {
  event_source_arn = data.terraform_remote_state.services.outputs.notification_queue_arn
  function_name    = aws_lambda_function.notification_sender.arn
  enabled          = true

  batch_size                         = var.batch_size
  maximum_batching_window_in_seconds = 5

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-notification-sender-event-source" })
}
