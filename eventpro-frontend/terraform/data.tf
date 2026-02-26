# Route53 zone and services Terraform outputs

data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

data "terraform_remote_state" "services" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket = var.backend_bucket
    key    = var.backend_key_services
    region = var.backend_region_services
  }
}
