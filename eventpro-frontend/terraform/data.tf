# Route53 zone and services Terraform outputs

data "aws_route53_zone" "main" {
  name = var.domain_name
}

data "terraform_remote_state" "services" {
  backend = "s3"

  config = {
    bucket = var.backend_bucket
    key    = "env:/${terraform.workspace}/${var.backend_key_services}"
    region = var.aws_region
  }
}
