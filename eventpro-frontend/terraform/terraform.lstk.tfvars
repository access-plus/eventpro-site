aws_region  = "us-east-1"
domain_name = "localhost.localstack.cloud"

use_localstack      = true
localstack_endpoint = "http://localhost:4566"

shared_infra_state_bucket = "eventpro-site-state"
shared_infra_state_key    = "shared-infra/terraform.tfstate"
shared_infra_state_region = "us-east-1"

tags = {
  Project   = "eventpro"
  ManagedBy = "terraform"
}
