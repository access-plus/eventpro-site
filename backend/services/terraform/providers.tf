# AWS provider - default region from backend/config

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge(var.tags, { Env = terraform.workspace })
  }
}

# CloudFront ACM certificates must be created in us-east-1.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = merge(var.tags, { Env = terraform.workspace })
  }
}
