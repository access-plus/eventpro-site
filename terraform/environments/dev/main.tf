# Dev Environment - Main Configuration
# This file wires together all infrastructure modules for the dev environment

# Data Sources
data "aws_route53_zone" "main" {
  name         = var.route53_zone_name
  private_zone = var.route53_private_zone
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# VPC Module
module "vpc" {
  source = "../../modules/vpc"

  name_prefix = var.name_prefix
  vpc_cidr    = var.vpc_cidr

  tags = var.tags
}

# RDS Module
module "rds" {
  source = "../../modules/rds"

  name_prefix          = var.name_prefix
  db_instance_identifier = "${var.name_prefix}-rds"
  db_name             = var.db_name
  # db_username and db_password are now auto-generated in the module
  instance_class      = var.db_instance_class
  multi_az            = var.db_multi_az
  private_subnet_ids  = module.vpc.private_subnet_ids
  security_group_id   = module.vpc.rds_security_group_id

  tags = var.tags
}

# S3 Buckets
module "s3_images" {
  source = "../../modules/s3"

  bucket_name = "${var.name_prefix}-images"
  bucket_type = "images"
  force_destroy = true # Allow deletion in dev

  enable_cors = true
  cors_rules = [{
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    allowed_origins = ["https://${var.frontend_subdomain}.${var.domain_name}", "https://${module.cloudfront.distribution_domain_name}"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }]

  lifecycle_rules = [{
    id     = "image-lifecycle"
    status = "Enabled"
    transitions = [{
      days          = 90
      storage_class = "STANDARD_IA"
    }]
  }]

  tags = var.tags
}

module "s3_frontend" {
  source = "../../modules/s3"

  bucket_name = "${var.name_prefix}-frontend"
  bucket_type = "frontend"
  force_destroy = true # Allow deletion in dev

  enable_website = false # CloudFront will serve the content
  enable_cors    = true
  cors_rules = [{
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }]

  tags = var.tags
}

# CloudFront Module
module "cloudfront" {
  source = "../../modules/cloudfront"

  name_prefix = var.name_prefix
  enabled     = true
  comment     = "EventPro Frontend CDN Distribution"

  aliases = var.cloudfront_certificate_arn != null ? ["${var.frontend_subdomain}.${var.domain_name}"] : []

  origins = [
    {
      origin_id   = "s3-frontend"
      domain_name = module.s3_frontend.bucket_regional_domain_name
      origin_type = "s3"
    }
  ]

  default_cache_behavior = {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-frontend"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id        = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
  }

  ordered_cache_behaviors = []

  custom_error_responses = [
    {
      error_code            = 404
      response_code         = 200
      response_page_path    = "/index.html"
      error_caching_min_ttl = 300
    }
  ]

  geo_restriction_type = "none"

  acm_certificate_arn      = var.cloudfront_certificate_arn
  minimum_protocol_version = "TLSv1.2_2021"

  price_class = "PriceClass_100" # US, Canada, Europe for dev

  tags = var.tags
}

# Cognito Module
module "cognito" {
  source = "../../modules/cognito"

  name_prefix = var.name_prefix

  custom_attributes = [
    {
      name                = "role"
      attribute_data_type = "String"
      mutable             = true
      required            = false
      string_constraints = {
        min_length = 0
        max_length = 50
      }
    }
  ]

  user_groups = {
    admin = {
      name        = "ADMIN"
      description = "Administrator group"
      precedence  = 1
    }
    organizer = {
      name        = "ORGANIZER"
      description = "Event organizer group"
      precedence  = 2
    }
    user = {
      name        = "USER"
      description = "Regular user group"
      precedence  = 3
    }
  }

  domain            = var.cognito_domain
  certificate_arn   = var.cognito_certificate_arn

  callback_urls = [
    "https://${var.frontend_subdomain}.${var.domain_name}/auth/callback",
    "http://localhost:5173/auth/callback" # For local development
  ]

  logout_urls = [
    "https://${var.frontend_subdomain}.${var.domain_name}/auth/logout",
    "http://localhost:5173/auth/logout" # For local development
  ]

  tags = var.tags
}

# Secrets Manager Module
module "secrets_manager" {
  source = "../../modules/secrets-manager"

  name_prefix = var.name_prefix

  secrets = {
    database = {
      name        = "database-credentials"
      description = "RDS PostgreSQL database credentials"
      secret_key_value = {
        username = module.rds.db_instance_username
        password = module.rds.db_password
        engine   = "postgres"
        host     = module.rds.db_instance_endpoint
        port     = tostring(module.rds.db_instance_port)
        dbname   = var.db_name
      }
      rotation_enabled = false # Can be enabled later with Lambda function
    }
    stripe = {
      name        = "stripe-api-keys"
      description = "Stripe API keys for payment processing"
      secret_key_value = {
        secret_key      = var.stripe_secret_key != "" ? var.stripe_secret_key : "sk_test_placeholder"
        publishable_key = var.stripe_publishable_key != "" ? var.stripe_publishable_key : "pk_test_placeholder"
      }
      rotation_enabled = false
    }
  }

  tags = var.tags
}

# ALB Module
module "alb" {
  source = "../../modules/alb"

  name_prefix = var.name_prefix
  service_name = "api"
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.public_subnet_ids
  security_group_ids = [module.vpc.alb_security_group_id]

  internal              = var.alb_internal
  certificate_arn       = var.alb_certificate_arn
  target_port           = 8080
  health_check_path     = "/actuator/health"
  health_check_protocol = "HTTP"

  # Cognito authentication (optional)
  cognito_user_pool_arn       = module.cognito.user_pool_arn
  cognito_user_pool_client_id = module.cognito.user_pool_client_id
  cognito_user_pool_domain    = module.cognito.user_pool_domain_name

  tags = var.tags
}

# ECS Module - Core API
module "ecs_core_api" {
  source = "../../modules/ecs"

  name_prefix    = var.name_prefix
  service_name   = "core-api"
  container_name = "core-api"
  container_image = var.ecs_container_image
  container_port = 8080

  task_cpu    = 512
  task_memory = 1024
  desired_count = var.ecs_desired_count

  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_ids = [module.vpc.ecs_security_group_id]
  target_group_arn   = module.alb.primary_target_group_arn

  environment_variables = [
    {
      name  = "SPRING_PROFILES_ACTIVE"
      value = "dev"
    },
    {
      name  = "DB_URL"
      value = "jdbc:postgresql://${module.rds.db_instance_endpoint}/${var.db_name}"
    },
    {
      name  = "DB_USERNAME"
      value = module.rds.db_instance_username
    },
    {
      name  = "DB_PASSWORD"
      value = module.rds.db_password
    },
    {
      name  = "COGNITO_USER_POOL_ID"
      value = module.cognito.user_pool_id
    },
    {
      name  = "COGNITO_CLIENT_ID"
      value = module.cognito.user_pool_client_id
    },
    {
      name  = "AWS_REGION"
      value = var.aws_region
    },
    {
      name  = "DB_SECRET_ARN"
      value = module.secrets_manager.secret_arns["database"]
    }
  ]

  tags = var.tags
}

# Target Group for Event API
resource "aws_lb_target_group" "event_api" {
  name        = "${var.name_prefix}-event-api-tg"
  port        = 8081
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/actuator/health"
    protocol            = "HTTP"
    matcher             = "200"
    port                = "traffic-port"
  }

  deregistration_delay = 300
  slow_start           = 0

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-event-api-tg"
    }
  )
}

# ALB Listener Rule for Event API
# Use HTTPS listener if certificate is provided, otherwise use HTTP listener
resource "aws_lb_listener_rule" "event_api" {
  listener_arn = var.alb_certificate_arn != null ? module.alb.https_listener_arn : module.alb.http_listener_arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.event_api.arn
  }

  condition {
    host_header {
      values = ["${var.event_api_subdomain}.${var.domain_name}"]
    }
  }
}

# ECS Module - Event API
module "ecs_event_api" {
  source = "../../modules/ecs"

  name_prefix    = var.name_prefix
  service_name   = "event-api"
  container_name = "event-api"
  container_image = var.ecs_container_image
  container_port = 8081

  task_cpu    = 512
  task_memory = 1024
  desired_count = var.ecs_desired_count

  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_ids = [module.vpc.ecs_security_group_id]
  target_group_arn   = aws_lb_target_group.event_api.arn

  environment_variables = [
    {
      name  = "SPRING_PROFILES_ACTIVE"
      value = "dev"
    },
    {
      name  = "DB_URL"
      value = "jdbc:postgresql://${module.rds.db_instance_endpoint}/${var.db_name}"
    },
    {
      name  = "DB_USERNAME"
      value = module.rds.db_instance_username
    },
    {
      name  = "DB_PASSWORD"
      value = module.rds.db_password
    },
    {
      name  = "COGNITO_USER_POOL_ID"
      value = module.cognito.user_pool_id
    },
    {
      name  = "COGNITO_CLIENT_ID"
      value = module.cognito.user_pool_client_id
    },
    {
      name  = "AWS_REGION"
      value = var.aws_region
    }
  ]

  tags = var.tags
}

# Route53 Module
module "route53" {
  source = "../../modules/route53"

  zone_id = data.aws_route53_zone.main.zone_id

  records = {
    frontend = {
      name = "${var.frontend_subdomain}.${var.domain_name}"
      type = "A"
      alias = {
        name                   = module.cloudfront.distribution_domain_name
        zone_id                = module.cloudfront.distribution_hosted_zone_id
        evaluate_target_health = false
      }
    }
    core-api = {
      name = "${var.core_api_subdomain}.${var.domain_name}"
      type = "A"
      alias = {
        name                   = module.alb.alb_dns_name
        zone_id                = module.alb.alb_zone_id
        evaluate_target_health = true
      }
    }
    event-api = {
      name = "${var.event_api_subdomain}.${var.domain_name}"
      type = "A"
      alias = {
        name                   = module.alb.alb_dns_name
        zone_id                = module.alb.alb_zone_id
        evaluate_target_health = true
      }
    }
  }

  tags = var.tags
}

