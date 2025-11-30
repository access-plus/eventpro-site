# Local Environment - Main Configuration
# This file provisions AWS resources in LocalStack for local development



# Include provider settings from settings.tf
# (settings.tf configures LocalStack endpoints)

# SQS Dead Letter Queues (provisioned in LocalStack)
resource "aws_sqs_queue" "order_queue_dlq" {
  provider = aws.localstack

  name                      = "order-queue-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name        = "order-queue-dlq"
    Environment = "local"
    Purpose     = "Order processing queue - Dead Letter Queue"
  }
}

resource "aws_sqs_queue" "payment_queue_dlq" {
  provider = aws.localstack

  name                      = "payment-queue-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name        = "payment-queue-dlq"
    Environment = "local"
    Purpose     = "Payment processing queue - Dead Letter Queue"
  }
}

resource "aws_sqs_queue" "notification_queue_dlq" {
  provider = aws.localstack

  name                      = "notification-queue-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name        = "notification-queue-dlq"
    Environment = "local"
    Purpose     = "Notification sending queue - Dead Letter Queue"
  }
}

# SQS Queues (provisioned in LocalStack)
resource "aws_sqs_queue" "order_queue" {
  provider = aws.localstack

  name                       = "order-queue"
  message_retention_seconds  = 345600 # 4 days
  visibility_timeout_seconds = 360 # 6 minutes (must be >= Lambda timeout)
  receive_wait_time_seconds  = 20 # Long polling

  # Dead-letter queue configuration
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.order_queue_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name        = "order-queue"
    Environment = "local"
    Purpose     = "Order processing queue"
  }
}

resource "aws_sqs_queue" "payment_queue" {
  provider = aws.localstack

  name                       = "payment-queue"
  message_retention_seconds  = 345600 # 4 days
  visibility_timeout_seconds = 360 # 6 minutes (must be >= Lambda timeout)
  receive_wait_time_seconds  = 20 # Long polling

  # Dead-letter queue configuration
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.payment_queue_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name        = "payment-queue"
    Environment = "local"
    Purpose     = "Payment processing queue"
  }
}

resource "aws_sqs_queue" "notification_queue" {
  provider = aws.localstack

  name                       = "notification-queue"
  message_retention_seconds  = 345600 # 4 days
  visibility_timeout_seconds = 360 # 6 minutes (must be >= Lambda timeout)
  receive_wait_time_seconds  = 20 # Long polling

  # Dead-letter queue configuration
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.notification_queue_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name        = "notification-queue"
    Environment = "local"
    Purpose     = "Notification sending queue"
  }
}

# S3 Bucket for Event Images (provisioned in LocalStack)
resource "aws_s3_bucket" "images" {
  provider = aws.localstack

  bucket        = "eventpro-images-local"
  force_destroy = true

  tags = {
    Name        = "eventpro-images-local"
    Environment = "local"
    Purpose     = "Event images storage"
  }
}

# S3 Bucket CORS Configuration
resource "aws_s3_bucket_cors_configuration" "images" {
  provider = aws.localstack
  bucket   = aws_s3_bucket.images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    allowed_origins = ["http://localhost:5173", "http://localhost:3000"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# S3 Bucket Public Access (for local development - allows public read)
resource "aws_s3_bucket_public_access_block" "images" {
  provider = aws.localstack
  bucket   = aws_s3_bucket.images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3 Bucket Policy for Public Read
resource "aws_s3_bucket_policy" "images" {
  provider = aws.localstack
  bucket   = aws_s3_bucket.images.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.images.arn}/*"
      }
    ]
  })
}

# Cognito User Pool (provisioned in real AWS)
# Uses real AWS credentials from environment variables or ~/.aws/credentials
# Requires AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set, or AWS CLI configured
resource "aws_cognito_user_pool" "main" {
  provider = aws.aws
  name     = "eventpro-local-user-pool"

  # Password Policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  # Email Configuration (for local, use COGNITO_DEFAULT)
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Auto Verified Attributes
  auto_verified_attributes = ["email"]

  # Schema - Custom Attributes for Roles
  schema {
    name                     = "role"
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    required                 = false

    string_attribute_constraints {
      min_length = 0
      max_length = 50
    }
  }

  # Account Recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Admin Create User
  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  # Deletion Protection (disabled for local)
  deletion_protection = "INACTIVE"

  tags = {
    Name        = "eventpro-local-user-pool"
    Environment = "local"
  }
}

# Cognito User Pool Client (provisioned in real AWS)
resource "aws_cognito_user_pool_client" "main" {
  provider     = aws.aws
  name         = "eventpro-local-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # OAuth Configuration
  generate_secret                      = false
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  allowed_oauth_flows_user_pool_client = true
  callback_urls                        = ["http://localhost:5173", "http://localhost:3000"]
  logout_urls                          = ["http://localhost:5173", "http://localhost:3000"]

  # Token Validity
  access_token_validity  = 6  # 6 hour
  id_token_validity      = 6  # 6 hour
  refresh_token_validity = 30 # 30 days

  # Explicit Auth Flows
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]

  supported_identity_providers = ["COGNITO"]
}

# Cognito User Pool Groups (provisioned in real AWS)
resource "aws_cognito_user_group" "admin" {
  provider     = aws.aws
  name         = "ADMIN"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Administrator group"
  precedence   = 1
}

resource "aws_cognito_user_group" "organizer" {
  provider     = aws.aws
  name         = "ORGANIZER"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Event organizer group"
  precedence   = 2
}

resource "aws_cognito_user_group" "user" {
  provider     = aws.aws
  name         = "USER"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Regular user group"
  precedence   = 3
}

# Secrets Manager - Database Secret (provisioned in LocalStack)
resource "aws_secretsmanager_secret" "database" {
  provider = aws.localstack

  name        = "eventpro-db-secret"
  description = "Database credentials for local development"

  tags = {
    Name        = "eventpro-db-secret"
    Environment = "local"
  }
}

resource "aws_secretsmanager_secret_version" "database" {
  provider  = aws.localstack
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    host     = "localhost"
    port     = "5432"
    dbname   = "eventpro"
    username = "eventpro"
    password = "eventpro"
  })
}

# Secrets Manager - JWT Secret (provisioned in LocalStack)
resource "aws_secretsmanager_secret" "jwt" {
  provider = aws.localstack

  name        = "eventpro-jwt-secret"
  description = "JWT secret key for local development"

  tags = {
    Name        = "eventpro-jwt-secret"
    Environment = "local"
  }
}

resource "aws_secretsmanager_secret_version" "jwt" {
  provider      = aws.localstack
  secret_id     = aws_secretsmanager_secret.jwt.id
  secret_string = "Dh7fjbnd2O2iSkqpYL/lz2nM3LE/8fC36iFNPHERysc="
}

# Secrets Manager - Stripe Keys (provisioned in LocalStack)
resource "aws_secretsmanager_secret" "stripe" {
  provider = aws.localstack

  name        = "eventpro-stripe-keys"
  description = "Stripe API keys for local development"

  tags = {
    Name        = "eventpro-stripe-keys"
    Environment = "local"
  }
}

resource "aws_secretsmanager_secret_version" "stripe" {
  provider  = aws.localstack
  secret_id = aws_secretsmanager_secret.stripe.id
  secret_string = jsonencode({
    secret_key      = "sk_test_local"
    publishable_key = "pk_test_local"
    webhook_secret  = "whsec_test_local"
  })
}

# Lambda Functions (provisioned in LocalStack)
# These Lambda functions are managed by LocalStack and automatically triggered by SQS event source mappings

# CloudWatch Log Groups for Lambda Functions
resource "aws_cloudwatch_log_group" "order_processor" {
  provider          = aws.localstack
  name              = "/aws/lambda/local-order-processor"
  retention_in_days = 7

  tags = {
    Name        = "local-order-processor-logs"
    Environment = "local"
  }
}

resource "aws_cloudwatch_log_group" "payment_processor" {
  provider          = aws.localstack
  name              = "/aws/lambda/local-payment-processor"
  retention_in_days = 7

  tags = {
    Name        = "local-payment-processor-logs"
    Environment = "local"
  }
}

resource "aws_cloudwatch_log_group" "notification_sender" {
  provider          = aws.localstack
  name              = "/aws/lambda/local-notification-sender"
  retention_in_days = 7

  tags = {
    Name        = "local-notification-sender-logs"
    Environment = "local"
  }
}

# IAM Roles for Lambda Functions
resource "aws_iam_role" "lambda_order_processor" {
  provider = aws.localstack
  name     = "local-order-processor-lambda-role"

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

  tags = {
    Name        = "local-order-processor-lambda-role"
    Environment = "local"
  }
}

resource "aws_iam_role_policy" "lambda_order_processor" {
  provider = aws.localstack
  name     = "local-order-processor-lambda-policy"
  role     = aws_iam_role.lambda_order_processor.id

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
        Resource = "${aws_cloudwatch_log_group.order_processor.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl"
        ]
        Resource = [
          aws_sqs_queue.order_queue.arn,
          aws_sqs_queue.payment_queue.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.payment_queue.arn
      }
    ]
  })
}

resource "aws_iam_role" "lambda_payment_processor" {
  provider = aws.localstack
  name     = "local-payment-processor-lambda-role"

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

  tags = {
    Name        = "local-payment-processor-lambda-role"
    Environment = "local"
  }
}

resource "aws_iam_role_policy" "lambda_payment_processor" {
  provider = aws.localstack
  name     = "local-payment-processor-lambda-policy"
  role     = aws_iam_role.lambda_payment_processor.id

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
        Resource = "${aws_cloudwatch_log_group.payment_processor.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl"
        ]
        Resource = [
          aws_sqs_queue.payment_queue.arn,
          aws_sqs_queue.notification_queue.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.notification_queue.arn
      }
    ]
  })
}

resource "aws_iam_role" "lambda_notification_sender" {
  provider = aws.localstack
  name     = "local-notification-sender-lambda-role"

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

  tags = {
    Name        = "local-notification-sender-lambda-role"
    Environment = "local"
  }
}

resource "aws_iam_role_policy" "lambda_notification_sender" {
  provider = aws.localstack
  name     = "local-notification-sender-lambda-policy"
  role     = aws_iam_role.lambda_notification_sender.id

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
        Resource = "${aws_cloudwatch_log_group.notification_sender.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl"
        ]
        Resource = aws_sqs_queue.notification_queue.arn
      }
    ]
  })
}

# Lambda Functions
resource "aws_lambda_function" "order_processor" {
  provider = aws.localstack

  function_name = "local-order-processor"
  description    = "Processes orders from SQS, validates them, reserves tickets, and publishes to payment queue"
  role          = aws_iam_role.lambda_order_processor.arn
  handler       = "io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest"
  runtime       = "provided.al2"
  timeout       = 300 # 5 minutes
  memory_size   = 512

  package_type = "Image"
  image_uri    = "eventpro-order-processor:local"

  environment {
    variables = {
      DB_URL                = "jdbc:postgresql://postgres:5432/eventpro"
      DB_USERNAME           = "eventpro"
      DB_PASSWORD           = "eventpro"
      AWS_ENDPOINT_URL      = "http://localstack:4566"
      AWS_REGION            = "us-east-1"
      AWS_ACCESS_KEY_ID     = "test"
      AWS_SECRET_ACCESS_KEY = "test"
      SQS_PAYMENT_QUEUE_URL = aws_sqs_queue.payment_queue.url
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.order_processor,
    aws_iam_role_policy.lambda_order_processor
  ]

  tags = {
    Name        = "local-order-processor"
    Environment = "local"
  }
}

resource "aws_lambda_function" "payment_processor" {
  provider = aws.localstack

  function_name = "local-payment-processor"
  description   = "Processes payments from SQS, calls Stripe, updates orders/tickets, and publishes to notification queue"
  role          = aws_iam_role.lambda_payment_processor.arn
  handler       = "io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest"
  runtime       = "provided.al2"
  timeout       = 300 # 5 minutes
  memory_size   = 512

  package_type = "Image"
  image_uri    = "eventpro-payment-processor:local"

  environment {
    variables = {
      DB_URL                   = "jdbc:postgresql://postgres:5432/eventpro"
      DB_USERNAME              = "eventpro"
      DB_PASSWORD              = "eventpro"
      AWS_ENDPOINT_URL         = "http://localstack:4566"
      AWS_REGION               = "us-east-1"
      AWS_ACCESS_KEY_ID        = "test"
      AWS_SECRET_ACCESS_KEY    = "test"
      SQS_NOTIFICATION_QUEUE_URL = aws_sqs_queue.notification_queue.url
      STRIPE_SECRET_KEY        = "sk_test_local"
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.payment_processor,
    aws_iam_role_policy.lambda_payment_processor
  ]

  tags = {
    Name        = "local-payment-processor"
    Environment = "local"
  }
}

resource "aws_lambda_function" "notification_sender" {
  provider = aws.localstack

  function_name = "local-notification-sender"
  description   = "Sends notifications from SQS queue via email, SMS, or in-app"
  role          = aws_iam_role.lambda_notification_sender.arn
  handler       = "io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest"
  runtime       = "provided.al2"
  timeout       = 60 # 1 minute
  memory_size   = 256

  package_type = "Image"
  image_uri    = "eventpro-notification-sender:local"

  environment {
    variables = {
      DB_URL             = "jdbc:postgresql://postgres:5432/eventpro"
      DB_USERNAME        = "eventpro"
      DB_PASSWORD        = "eventpro"
      AWS_ENDPOINT_URL   = "http://localstack:4566"
      AWS_REGION         = "us-east-1"
      AWS_ACCESS_KEY_ID  = "test"
      AWS_SECRET_ACCESS_KEY = "test"
      SES_SENDER_EMAIL   = "noreply@eventpro.com"
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.notification_sender,
    aws_iam_role_policy.lambda_notification_sender
  ]

  tags = {
    Name        = "local-notification-sender"
    Environment = "local"
  }
}

# SQS Event Source Mappings
resource "aws_lambda_event_source_mapping" "order_queue" {
  provider = aws.localstack

  event_source_arn = aws_sqs_queue.order_queue.arn
  function_name    = aws_lambda_function.order_processor.arn
  enabled          = true

  batch_size                         = 10
  maximum_batching_window_in_seconds = 0
  maximum_record_age_in_seconds      = 604800 # 7 days
  bisect_batch_on_function_error     = true
  maximum_retry_attempts             = 3

  depends_on = [
    aws_lambda_function.order_processor,
    aws_sqs_queue.order_queue
  ]
}

resource "aws_lambda_event_source_mapping" "payment_queue" {
  provider = aws.localstack

  event_source_arn = aws_sqs_queue.payment_queue.arn
  function_name    = aws_lambda_function.payment_processor.arn
  enabled          = true

  batch_size                         = 1 # Critical path - process one at a time
  maximum_batching_window_in_seconds = 0
  maximum_record_age_in_seconds      = 604800 # 7 days
  bisect_batch_on_function_error     = true
  maximum_retry_attempts             = 3

  depends_on = [
    aws_lambda_function.payment_processor,
    aws_sqs_queue.payment_queue
  ]
}

resource "aws_lambda_event_source_mapping" "notification_queue" {
  provider = aws.localstack

  event_source_arn = aws_sqs_queue.notification_queue.arn
  function_name    = aws_lambda_function.notification_sender.arn
  enabled          = true

  batch_size                         = 10
  maximum_batching_window_in_seconds = 0
  maximum_record_age_in_seconds      = 604800 # 7 days
  bisect_batch_on_function_error     = true
  maximum_retry_attempts             = 3

  depends_on = [
    aws_lambda_function.notification_sender,
    aws_sqs_queue.notification_queue
  ]
}

