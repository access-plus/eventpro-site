# Route53 records: API alias to ALB
# ACM cert created manually for *.domain_name; pass ARN via variable

# API A record: ${workspace}-api.${domain_name} -> ALB
resource "aws_route53_record" "api" {
  count = local.route53_zone_id != null && var.domain_name != "" ? 1 : 0

  zone_id = local.route53_zone_id
  name    = "${local.workspace}-api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
