aws_region  = "us-east-1"
domain_name = "eventpro.localhost.localstack.cloud"

use_localstack      = true
localstack_endpoint = "http://localhost:4566"

order_queue_visibility_timeout_seconds        = 360
payment_queue_visibility_timeout_seconds      = 360
notification_queue_visibility_timeout_seconds = 360

tags = {
  Project   = "eventpro"
  ManagedBy = "terraform"
}
