domain_name = "eventpro.localhost.localstack.cloud"

use_localstack      = true
localstack_endpoint = "http://localhost:4566"

image_registry = "localstack"
image_name     = "eventpro-api"
image_tag      = "local"

shared_infra_state_bucket = "eventpro-site-state"
shared_infra_state_key    = "shared-infra/terraform.tfstate"
shared_infra_state_region = "us-east-1"

jwt_issuer             = "eventpro"
jwt_access_ttl_seconds = 3600

stripe_secret_key      = "sk_test_local"
stripe_publishable_key = "pk_test_local"
stripe_webhook_secret  = "test_webhook_secret"

tags = {
  Project   = "eventpro"
  ManagedBy = "terraform"
}
