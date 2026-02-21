# Services Terraform - Outputs for frontend and lambdas (terraform_remote_state)

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.address
}

output "rds_port" {
  description = "RDS port"
  value       = aws_db_instance.main.port
}

output "rds_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "db_master_user_secret_arn" {
  description = "Secrets Manager ARN for RDS master user"
  value       = aws_db_instance.main.master_user_secret[0].secret_arn
}

output "order_queue_url" {
  description = "Order SQS queue URL"
  value       = aws_sqs_queue.order.url
}

output "order_queue_arn" {
  description = "Order SQS queue ARN"
  value       = aws_sqs_queue.order.arn
}

output "payment_queue_url" {
  description = "Payment SQS queue URL"
  value       = aws_sqs_queue.payment.url
}

output "payment_queue_arn" {
  description = "Payment SQS queue ARN"
  value       = aws_sqs_queue.payment.arn
}

output "notification_queue_url" {
  description = "Notification SQS queue URL"
  value       = aws_sqs_queue.notification.url
}

output "notification_queue_arn" {
  description = "Notification SQS queue ARN"
  value       = aws_sqs_queue.notification.arn
}

output "rds_security_group_id" {
  description = "RDS security group ID (for Lambda VPC config)"
  value       = aws_security_group.rds.id
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID (from data lookup)"
  value       = local.route53_zone_id
}

output "route53_zone_name" {
  description = "Route53 hosted zone name"
  value       = local.route53_zone_name
}

output "route53_name_servers" {
  description = "Name servers to add at your domain registrar for DNS delegation"
  value       = length(aws_route53_zone.main) > 0 ? aws_route53_zone.main[0].name_servers : []
}

output "cloudfront_certificate_arn" {
  description = "ACM certificate ARN for CloudFront (us-east-1, *.domain_name - pass in)"
  value       = var.cloudfront_certificate_arn != "" ? var.cloudfront_certificate_arn : null
}

output "alb_certificate_arn" {
  description = "ACM certificate ARN for ALB (*.domain_name - pass in)"
  value       = local.alb_cert_arn
}

output "s3_images_bucket_id" {
  description = "S3 images bucket name"
  value       = aws_s3_bucket.images.id
}

output "api_url" {
  description = "API base URL (when Route53 configured)"
  value       = local.route53_zone_id != null && var.domain_name != "" ? "https://${terraform.workspace}-api.${var.domain_name}" : "http://${aws_lb.main.dns_name}"
}
