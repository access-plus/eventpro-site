aws_region = "us-east-1"

use_localstack              = true
localstack_endpoint         = "http://localhost:4566"
localstack_runtime_endpoint = "http://host.docker.internal:4566"

image_registry = "localstack"
image_name     = "eventpro-order-processor"
image_tag      = "local"

shared_infra_state_bucket = "eventpro-site-state"
shared_infra_state_key    = "shared-infra/terraform.tfstate"
shared_infra_state_region = "us-east-1"

timeout_seconds = 360

tags = {
  Project   = "eventpro"
  ManagedBy = "terraform"
}
