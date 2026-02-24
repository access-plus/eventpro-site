# Data sources for default VPC and Route53 zone
# Uses terraform.workspace for multi-environment deployment

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Default VPC (no custom VPC creation per plan)
data "aws_vpc" "default" {
  default = true
}

# Default VPC subnets (for RDS, ECS, ALB)
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Route53 hosted zone (must exist in account)
data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

locals {
  workspace   = terraform.workspace
  name_prefix = local.workspace
  image_uri   = "${var.image_registry}/${var.image_name}:${var.image_tag}"
  common_tags = merge(var.tags, { Env = local.workspace })
}
