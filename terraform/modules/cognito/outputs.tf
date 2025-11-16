# Cognito Module - Outputs

output "user_pool_id" {
  description = "ID of the user pool"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "ARN of the user pool"
  value       = aws_cognito_user_pool.main.arn
}

output "user_pool_name" {
  description = "Name of the user pool"
  value       = aws_cognito_user_pool.main.name
}

output "user_pool_endpoint" {
  description = "Endpoint name of the user pool"
  value       = aws_cognito_user_pool.main.endpoint
}

output "user_pool_domain" {
  description = "Holds the domain prefix if the user pool has a domain associated with it"
  value       = aws_cognito_user_pool.main.domain
}

output "user_pool_custom_domain" {
  description = "A custom domain name that you provide to Amazon Cognito"
  value       = aws_cognito_user_pool.main.custom_domain
}

output "user_pool_client_id" {
  description = "ID of the user pool client"
  value       = aws_cognito_user_pool_client.main.id
}

output "user_pool_client_secret" {
  description = "Client secret of the user pool client (only if generate_secret is true)"
  value       = aws_cognito_user_pool_client.main.client_secret
  sensitive   = true
}

output "user_pool_domain_name" {
  description = "Domain name of the user pool domain"
  value       = var.domain != null ? aws_cognito_user_pool_domain.main[0].domain : null
}

output "user_pool_domain_cloudfront_distribution" {
  description = "The Amazon CloudFront endpoint that you use as the target of the alias that you set up with your DNS provider"
  value       = var.domain != null ? aws_cognito_user_pool_domain.main[0].cloudfront_distribution : null
}

output "user_pool_domain_cloudfront_distribution_arn" {
  description = "The URL of the CloudFront distribution"
  value       = var.domain != null ? aws_cognito_user_pool_domain.main[0].cloudfront_distribution_arn : null
}

output "user_pool_domain_cloudfront_distribution_zone_id" {
  description = "The Route 53 hosted zone ID of the CloudFront distribution"
  value       = var.domain != null ? aws_cognito_user_pool_domain.main[0].cloudfront_distribution_zone_id : null
}

output "user_group_names" {
  description = "Map of user group names (key is group name)"
  value = {
    for k, v in aws_cognito_user_group.roles : k => v.name
  }
}

output "user_group_ids" {
  description = "Map of user group IDs (key is group name)"
  value = {
    for k, v in aws_cognito_user_group.roles : k => v.id
  }
}

