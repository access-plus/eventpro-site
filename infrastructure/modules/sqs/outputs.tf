# SQS Module - Outputs

output "queue_id" {
  description = "URL for the created Amazon SQS queue"
  value       = aws_sqs_queue.main.id
}

output "queue_url" {
  description = "URL for the created Amazon SQS queue (same as queue_id)"
  value       = aws_sqs_queue.main.url
}

output "queue_arn" {
  description = "ARN of the SQS queue"
  value       = aws_sqs_queue.main.arn
}

output "queue_name" {
  description = "Name of the SQS queue"
  value       = aws_sqs_queue.main.name
}

