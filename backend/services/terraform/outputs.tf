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

output "lambda_subnet_ids" {
  description = "Default VPC subnet IDs (for Lambda VPC config to reach RDS)"
  value       = data.aws_subnets.default.ids
}

output "ecs_security_group_id" {
  description = "ECS security group ID (Lambda uses this to reach RDS - RDS allows from ECS)"
  value       = aws_security_group.ecs.id
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = data.aws_route53_zone.main.zone_id
}

output "route53_zone_name" {
  description = "Route53 hosted zone name"
  value       = data.aws_route53_zone.main.name
}

output "cloudfront_certificate_arn" {
  description = "ACM certificate ARN for CloudFront (us-east-1, managed in services Terraform)"
  value       = aws_acm_certificate_validation.cloudfront.certificate_arn
}

output "alb_certificate_arn" {
  description = "ACM certificate ARN for ALB (managed in services Terraform)"
  value       = local.alb_cert_arn
}

output "s3_images_bucket_id" {
  description = "S3 images bucket name"
  value       = aws_s3_bucket.images.id
}

output "load_balancer_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "load_balancer_url" {
  description = "Application Load Balancer URL (AWS DNS endpoint)"
  value       = "https://${aws_lb.main.dns_name}"
}

output "api_url" {
  description = "API base URL"
  value       = "${local.alb_cert_arn != null ? "https" : "http"}://${terraform.workspace}-api.${var.domain_name}"
}
