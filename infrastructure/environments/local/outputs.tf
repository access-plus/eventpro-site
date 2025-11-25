# Local Environment - Outputs
# Outputs for local development environment

output "sqs_order_queue_url" {
  description = "SQS Order Queue URL"
  value       = aws_sqs_queue.order_queue.url
}

output "sqs_payment_queue_url" {
  description = "SQS Payment Queue URL"
  value       = aws_sqs_queue.payment_queue.url
}

output "sqs_notification_queue_url" {
  description = "SQS Notification Queue URL"
  value       = aws_sqs_queue.notification_queue.url
}

output "s3_images_bucket_name" {
  description = "S3 Images Bucket Name"
  value       = aws_s3_bucket.images.id
}

output "s3_images_bucket_arn" {
  description = "S3 Images Bucket ARN"
  value       = aws_s3_bucket.images.arn
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = try(aws_cognito_user_pool.main.id, null)
}

output "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = try(aws_cognito_user_pool.main.arn, null)
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = try(aws_cognito_user_pool_client.main.id, null)
}

output "cognito_user_pool_domain" {
  description = "Cognito User Pool Domain"
  value       = try(aws_cognito_user_pool.main.domain, null)
}

output "secrets_manager_database_secret_arn" {
  description = "Database Secret ARN"
  value       = aws_secretsmanager_secret.database.arn
}

output "secrets_manager_jwt_secret_arn" {
  description = "JWT Secret ARN"
  value       = aws_secretsmanager_secret.jwt.arn
}

output "secrets_manager_stripe_secret_arn" {
  description = "Stripe Secret ARN"
  value       = aws_secretsmanager_secret.stripe.arn
}

# Convenience output for environment variables
output "environment_variables" {
  description = "Environment variables for application configuration"
  value = {
    ORDER_QUEUE_URL        = aws_sqs_queue.order_queue.url
    PAYMENT_QUEUE_URL      = aws_sqs_queue.payment_queue.url
    NOTIFICATION_QUEUE_URL = aws_sqs_queue.notification_queue.url
    S3_BUCKET_NAME         = aws_s3_bucket.images.id
    COGNITO_USER_POOL_ID   = try(aws_cognito_user_pool.main.id, null)
    COGNITO_CLIENT_ID      = try(aws_cognito_user_pool_client.main.id, null)
    DB_SECRET_ARN          = aws_secretsmanager_secret.database.arn
  }
}

