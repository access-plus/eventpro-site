# AWS provider - default region from backend/config

provider "aws" {
  default_tags {
    tags = merge(var.tags, { Env = terraform.workspace })
  }
}
