# Route53 hosted zone - create for domain you own
# After apply, add the name_servers output to your domain registrar's NS records

resource "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0

  name    = "${var.domain_name}."
  comment = "EventPro - ${local.workspace}"

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-${var.domain_name}" })
}

locals {
  route53_zone_id   = length(aws_route53_zone.main) > 0 ? aws_route53_zone.main[0].zone_id : null
  route53_zone_name = length(aws_route53_zone.main) > 0 ? aws_route53_zone.main[0].name : null
}
