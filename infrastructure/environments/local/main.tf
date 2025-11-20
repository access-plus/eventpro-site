# Local Environment - Main Configuration
# This file provisions AWS resources in LocalStack for local development

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

# Include provider settings from settings.tf
# (settings.tf configures LocalStack endpoints)

# SQS Queues
resource "aws_sqs_queue" "order_queue" {
  name                      = "order-queue"
  message_retention_seconds = 345600 # 4 days
  visibility_timeout_seconds = 30
  
  tags = {
    Name        = "order-queue"
    Environment = "local"
    Purpose     = "Order processing queue"
  }
}

resource "aws_sqs_queue" "payment_queue" {
  name                      = "payment-queue"
  message_retention_seconds = 345600 # 4 days
  visibility_timeout_seconds = 30
  
  tags = {
    Name        = "payment-queue"
    Environment = "local"
    Purpose     = "Payment processing queue"
  }
}

resource "aws_sqs_queue" "notification_queue" {
  name                      = "notification-queue"
  message_retention_seconds = 345600 # 4 days
  visibility_timeout_seconds = 30
  
  tags = {
    Name        = "notification-queue"
    Environment = "local"
    Purpose     = "Notification sending queue"
  }
}

# S3 Bucket for Event Images
resource "aws_s3_bucket" "images" {
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
  bucket = aws_s3_bucket.images.id

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
  bucket = aws_s3_bucket.images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3 Bucket Policy for Public Read
resource "aws_s3_bucket_policy" "images" {
  bucket = aws_s3_bucket.images.id

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

# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = "eventpro-local-user-pool"

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

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "main" {
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
  access_token_validity  = 60  # 1 hour
  id_token_validity      = 60  # 1 hour
  refresh_token_validity = 30  # 30 days

  # Explicit Auth Flows
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]

  supported_identity_providers = ["COGNITO"]
}

# Cognito User Pool Groups
resource "aws_cognito_user_group" "admin" {
  name         = "ADMIN"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Administrator group"
  precedence   = 1
}

resource "aws_cognito_user_group" "organizer" {
  name         = "ORGANIZER"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Event organizer group"
  precedence   = 2
}

resource "aws_cognito_user_group" "user" {
  name         = "USER"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Regular user group"
  precedence   = 3
}

# Secrets Manager - Database Secret
resource "aws_secretsmanager_secret" "database" {
  name        = "eventpro-db-secret"
  description = "Database credentials for local development"

  tags = {
    Name        = "eventpro-db-secret"
    Environment = "local"
  }
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    host     = "localhost"
    port     = "5432"
    dbname   = "eventpro"
    username = "eventpro"
    password = "eventpro"
  })
}

# Secrets Manager - JWT Secret
resource "aws_secretsmanager_secret" "jwt" {
  name        = "eventpro-jwt-secret"
  description = "JWT secret key for local development"

  tags = {
    Name        = "eventpro-jwt-secret"
    Environment = "local"
  }
}

resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id = aws_secretsmanager_secret.jwt.id
  secret_string = "Dh7fjbnd2O2iSkqpYL/lz2nM3LE/8fC36iFNPHERysc="
}

# Secrets Manager - Stripe Keys
resource "aws_secretsmanager_secret" "stripe" {
  name        = "eventpro-stripe-keys"
  description = "Stripe API keys for local development"

  tags = {
    Name        = "eventpro-stripe-keys"
    Environment = "local"
  }
}

resource "aws_secretsmanager_secret_version" "stripe" {
  secret_id = aws_secretsmanager_secret.stripe.id
  secret_string = jsonencode({
    secret_key      = "sk_test_local"
    publishable_key = "pk_test_local"
  })
}

