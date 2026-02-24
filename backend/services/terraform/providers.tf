# AWS provider - default region from backend/config

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge(var.tags, { Env = terraform.workspace })
  }
}
