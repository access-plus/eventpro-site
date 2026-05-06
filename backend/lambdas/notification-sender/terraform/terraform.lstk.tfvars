aws_region = "us-east-1"

use_localstack      = true
localstack_endpoint = "http://localhost:4566"

image_registry = "localstack"
image_name     = "eventpro-notification-sender"
image_tag      = "local"

shared_infra_state_bucket = "eventpro-site-state"
shared_infra_state_key    = "shared-infra/terraform.tfstate"
shared_infra_state_region = "us-east-1"

ses_sender_email = "noreply@eventpro.com"
timeout_seconds  = 360

tags = {
  Project   = "eventpro"
  ManagedBy = "terraform"
}
