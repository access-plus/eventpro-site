#!/usr/bin/env bash
# Complete LocalStack Pro deployment for production-shaped Terraform stacks.
# Real AWS deployment stays in scripts/pipeline-deploy.sh.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE=".env.lstk"
COMPOSE_FILE="docker-compose.lstk.yml"
WORKSPACE_NAME="${WORKSPACE:-lstk}"
ACTION="plan"
ONLY="all"
START_LOCALSTACK=false
START_ONLY=false
PRINT_ENDPOINTS_ONLY=false
BOOTSTRAP_STATE_ONLY=false
BOOTSTRAP_ROUTE53_ONLY=false
BUILD_IMAGES=true
FRONTEND_SYNC=true
FRONTEND_INVALIDATE=true

STATE_BUCKET_DEFAULT="eventpro-site-state"
STATE_REGION_DEFAULT="us-east-1"
LOCALSTACK_ENDPOINT_DEFAULT="http://localhost:4566"
RUNTIME_ENDPOINT_DEFAULT="http://host.docker.internal:4566"

usage() {
  cat <<'EOF'
Usage: scripts/lstk-deploy.sh [options]

Options:
  --plan                     Run Terraform plan (default)
  --apply                    Run Terraform apply -auto-approve
  --destroy                  Run Terraform destroy -auto-approve
  --only TARGET              all|shared-infra|services|frontend|lambdas|order-processor|payment-processor|notification-sender
  --env-file FILE            LocalStack env file (default: .env.lstk)
  --compose-file FILE        LocalStack compose file (default: docker-compose.lstk.yml)
  --workspace NAME           Terraform workspace (default: WORKSPACE env or lstk)
  --start                    Start LocalStack Pro via docker compose before running
  --start-only               Start LocalStack Pro via docker compose and exit
  --bootstrap-state          Create the LocalStack Terraform state bucket and exit
  --bootstrap-route53        Create the LocalStack Route53 hosted zone and exit
  --print-endpoints          Print LocalStack application endpoints and exit
  --skip-build-images        Do not build/tag API and Lambda images before apply
  --no-frontend-sync         Do not sync eventpro-frontend/dist to S3 after frontend apply
  --no-frontend-invalidate   Do not create a CloudFront invalidation after frontend apply
  -h, --help                 Show this help

Examples:
  scripts/lstk-deploy.sh --apply
  scripts/lstk-deploy.sh --destroy
  scripts/lstk-deploy.sh --print-endpoints
  scripts/lstk-deploy.sh --apply --only services
  scripts/lstk-deploy.sh --plan --only lambdas
EOF
}

log() {
  printf '%s\n' "$*"
}

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "$1 is required"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --plan)
      ACTION="plan"
      shift
      ;;
    --apply)
      ACTION="apply"
      shift
      ;;
    --destroy)
      ACTION="destroy"
      shift
      ;;
    --only)
      [ $# -ge 2 ] || die "Missing value for --only"
      ONLY="$2"
      shift 2
      ;;
    --env-file)
      [ $# -ge 2 ] || die "Missing value for --env-file"
      ENV_FILE="$2"
      shift 2
      ;;
    --compose-file)
      [ $# -ge 2 ] || die "Missing value for --compose-file"
      COMPOSE_FILE="$2"
      shift 2
      ;;
    --workspace)
      [ $# -ge 2 ] || die "Missing value for --workspace"
      WORKSPACE_NAME="$2"
      shift 2
      ;;
    --start)
      START_LOCALSTACK=true
      shift
      ;;
    --start-only)
      START_LOCALSTACK=true
      START_ONLY=true
      shift
      ;;
    --bootstrap-state)
      BOOTSTRAP_STATE_ONLY=true
      shift
      ;;
    --bootstrap-route53)
      BOOTSTRAP_ROUTE53_ONLY=true
      shift
      ;;
    --print-endpoints)
      PRINT_ENDPOINTS_ONLY=true
      shift
      ;;
    --skip-build-images)
      BUILD_IMAGES=false
      shift
      ;;
    --no-frontend-sync)
      FRONTEND_SYNC=false
      shift
      ;;
    --no-frontend-invalidate)
      FRONTEND_INVALIDATE=false
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown option: $1"
      ;;
  esac
done

case "$ONLY" in
  all|shared-infra|services|frontend|lambdas|order-processor|payment-processor|notification-sender) ;;
  *) die "Unsupported --only target: $ONLY" ;;
esac

ENV_FILE_PATH="$ENV_FILE"
if [ "${ENV_FILE_PATH#/}" = "$ENV_FILE_PATH" ]; then
  ENV_FILE_PATH="$ROOT_DIR/$ENV_FILE_PATH"
fi
[ -f "$ENV_FILE_PATH" ] || die "$ENV_FILE_PATH is required"

COMPOSE_FILE_PATH="$COMPOSE_FILE"
if [ "${COMPOSE_FILE_PATH#/}" = "$COMPOSE_FILE_PATH" ]; then
  COMPOSE_FILE_PATH="$ROOT_DIR/$COMPOSE_FILE_PATH"
fi
[ -f "$COMPOSE_FILE_PATH" ] || die "$COMPOSE_FILE_PATH is required"

set -a
# shellcheck disable=SC1090
. "$ENV_FILE_PATH"
set +a

export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
export AWS_SESSION_TOKEN="${AWS_SESSION_TOKEN:-test}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-${AWS_REGION:-$STATE_REGION_DEFAULT}}"
export AWS_REGION="${AWS_REGION:-$AWS_DEFAULT_REGION}"
export AWS_EC2_METADATA_DISABLED="${AWS_EC2_METADATA_DISABLED:-true}"
export AWS_ENDPOINT_URL="${AWS_ENDPOINT_URL:-$LOCALSTACK_ENDPOINT_DEFAULT}"

DOMAIN_NAME="${DOMAIN_NAME:-localhost.localstack.cloud}"
STATE_BUCKET="${TF_STATE_BUCKET:-$STATE_BUCKET_DEFAULT}"
STATE_REGION="${TF_STATE_REGION:-$STATE_REGION_DEFAULT}"
LOCALSTACK_RUNTIME_ENDPOINT="${LOCALSTACK_RUNTIME_ENDPOINT:-$RUNTIME_ENDPOINT_DEFAULT}"

export TF_VAR_domain_name="$DOMAIN_NAME"
export TF_VAR_aws_region="$AWS_REGION"
export TF_VAR_localstack_endpoint="$AWS_ENDPOINT_URL"
export TF_VAR_localstack_runtime_endpoint="$LOCALSTACK_RUNTIME_ENDPOINT"
export TF_VAR_jwt_public_key="${JWT_PUBLIC_KEY:-}"
export TF_VAR_jwt_private_key="${JWT_PRIVATE_KEY:-}"
export TF_VAR_stripe_secret_key="${STRIPE_SECRET_KEY:-sk_test_local}"
export TF_VAR_stripe_publishable_key="${STRIPE_PUBLISHABLE_KEY:-pk_test_local}"
export TF_VAR_stripe_webhook_secret="${STRIPE_WEBHOOK_SECRET:-test_webhook_secret}"
export TF_VAR_ses_sender_email="${SES_SENDER_EMAIL:-noreply@eventpro.com}"

aws_lstk() {
  aws --endpoint-url="$AWS_ENDPOINT_URL" "$@"
}

compose_lstk() {
  docker compose --env-file "$ENV_FILE_PATH" -f "$COMPOSE_FILE_PATH" "$@"
}

start_localstack() {
  require_cmd docker
  [ -n "${LOCALSTACK_AUTH_TOKEN:-}" ] || die "LOCALSTACK_AUTH_TOKEN is required in $ENV_FILE_PATH or env"
  log "Starting LocalStack Pro with docker compose..."
  compose_lstk up -d localstack
}

check_localstack() {
  require_cmd docker
  require_cmd aws
  log "Checking LocalStack Pro status..."
  compose_lstk ps localstack

  local attempt
  for attempt in $(seq 1 60); do
    if aws_lstk sts get-caller-identity >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done

  die "LocalStack did not become reachable at $AWS_ENDPOINT_URL"
}

bootstrap_state_bucket() {
  require_cmd aws
  log "Ensuring LocalStack Terraform state bucket exists: s3://$STATE_BUCKET"
  aws_lstk s3 mb "s3://$STATE_BUCKET" >/dev/null 2>&1 || true
  aws_lstk s3 ls "s3://$STATE_BUCKET" >/dev/null
}

bootstrap_route53_zone() {
  require_cmd aws
  local zone_id
  log "Ensuring LocalStack Route53 hosted zone exists: $DOMAIN_NAME"
  zone_id="$(aws_lstk route53 list-hosted-zones-by-name \
    --dns-name "$DOMAIN_NAME" \
    --query "HostedZones[?Name=='${DOMAIN_NAME}.' || Name=='${DOMAIN_NAME}'].Id | [0]" \
    --output text)"

  if [ -z "$zone_id" ] || [ "$zone_id" = "None" ]; then
    aws_lstk route53 create-hosted-zone \
      --name "$DOMAIN_NAME" \
      --caller-reference "eventpro-lstk-$DOMAIN_NAME" >/dev/null
  fi
}

select_workspace() {
  local stack_dir="$1"
  (
    cd "$ROOT_DIR/$stack_dir"
    terraform workspace select "$WORKSPACE_NAME" >/dev/null 2>&1 || terraform workspace new "$WORKSPACE_NAME" >/dev/null
  )
}

run_terraform_stack() {
  local stack_dir="$1"
  require_cmd terraform
  log "Running LocalStack Terraform ${ACTION}: $stack_dir (workspace=$WORKSPACE_NAME)"
  (
    cd "$ROOT_DIR/$stack_dir"
    terraform init -reconfigure -backend-config=backend.lstk.tfbackend
  )
  select_workspace "$stack_dir"
  (
    cd "$ROOT_DIR/$stack_dir"
    if [ "$ACTION" = "apply" ]; then
      terraform apply -auto-approve -var-file=terraform.lstk.tfvars
    elif [ "$ACTION" = "destroy" ]; then
      terraform destroy -auto-approve -var-file=terraform.lstk.tfvars
    else
      terraform plan -var-file=terraform.lstk.tfvars
    fi
  )
}

terraform_output_raw() {
  local stack_dir="$1"
  local output_name="$2"
  (
    cd "$ROOT_DIR/$stack_dir"
    terraform output -raw "$output_name"
  )
}

build_service_image() {
  [ "$BUILD_IMAGES" = true ] || return 0
  [ "$ACTION" = "apply" ] || return 0
  require_cmd docker
  local image_ref platform
  image_ref="${SERVICES_IMAGE_REGISTRY:-localstack}/${SERVICES_IMAGE_NAME:-eventpro-api}:${SERVICES_IMAGE_TAG:-local}"
  platform="${SERVICES_IMAGE_PLATFORM:-${SERVICES_IMAGE_PLATFORMS:-linux/amd64}}"
  log "Building LocalStack services image: $image_ref"
  docker image build --platform "$platform" -f "$ROOT_DIR/backend/services/Dockerfile" -t "$image_ref" "$ROOT_DIR/backend"
}

build_lambda_images() {
  [ "$BUILD_IMAGES" = true ] || return 0
  [ "$ACTION" = "apply" ] || return 0
  require_cmd docker
  log "Building LocalStack Lambda images"
  env -u AWS_ACCOUNT_ID "$ROOT_DIR/scripts/build-lambda-local.sh" all "${ORDER_PROCESSOR_IMAGE_TAG:-local}"

  docker tag "eventpro-order-processor:${ORDER_PROCESSOR_IMAGE_TAG:-local}" \
    "${ORDER_PROCESSOR_IMAGE_REGISTRY:-localstack}/${ORDER_PROCESSOR_IMAGE_NAME:-eventpro-order-processor}:${ORDER_PROCESSOR_IMAGE_TAG:-local}"
  docker tag "eventpro-payment-processor:${PAYMENT_PROCESSOR_IMAGE_TAG:-local}" \
    "${PAYMENT_PROCESSOR_IMAGE_REGISTRY:-localstack}/${PAYMENT_PROCESSOR_IMAGE_NAME:-eventpro-payment-processor}:${PAYMENT_PROCESSOR_IMAGE_TAG:-local}"
  docker tag "eventpro-notification-sender:${NOTIFICATION_SENDER_IMAGE_TAG:-local}" \
    "${NOTIFICATION_SENDER_IMAGE_REGISTRY:-localstack}/${NOTIFICATION_SENDER_IMAGE_NAME:-eventpro-notification-sender}:${NOTIFICATION_SENDER_IMAGE_TAG:-local}"
}

build_frontend() {
  [ "$ACTION" != "destroy" ] || return 0
  require_cmd npm
  local vite_api_base_url vite_asset_base_url
  vite_api_base_url="${VITE_API_BASE_URL:-https://${WORKSPACE_NAME}-api.${DOMAIN_NAME}}"
  vite_asset_base_url="${VITE_ASSET_BASE_URL:-https://localhost.localstack.cloud:4566/${WORKSPACE_NAME}-eventpro-site-frontend/}"
  log "Building frontend with VITE_API_BASE_URL=$vite_api_base_url"
  log "Building frontend with VITE_ASSET_BASE_URL=$vite_asset_base_url"
  (
    cd "$ROOT_DIR/eventpro-frontend"
    npm ci
    VITE_API_BASE_URL="$vite_api_base_url" VITE_ASSET_BASE_URL="$vite_asset_base_url" npm run build
  )
}

sync_frontend() {
  [ "$ACTION" = "apply" ] || return 0
  [ "$FRONTEND_SYNC" = true ] || return 0
  require_cmd aws
  local bucket_name
  bucket_name="$(terraform_output_raw eventpro-frontend/terraform bucket_name)"
  log "Syncing frontend assets to LocalStack S3: s3://$bucket_name/"
  aws_lstk s3 sync "$ROOT_DIR/eventpro-frontend/dist/" "s3://$bucket_name/" --delete
}

invalidate_frontend() {
  [ "$ACTION" = "apply" ] || return 0
  [ "$FRONTEND_INVALIDATE" = true ] || return 0
  require_cmd aws
  local dist_id
  dist_id="$(terraform_output_raw eventpro-frontend/terraform distribution_id)"
  log "Creating LocalStack CloudFront invalidation: $dist_id"
  aws_lstk cloudfront create-invalidation --distribution-id "$dist_id" --paths '/*' >/dev/null || true
}

run_shared_infra() {
  run_terraform_stack backend/shared-infra
}

run_services() {
  build_service_image
  run_terraform_stack backend/services/terraform
}

run_frontend() {
  build_frontend
  run_terraform_stack eventpro-frontend/terraform
  sync_frontend
  invalidate_frontend
}

run_lambda_order() {
  build_lambda_images
  run_terraform_stack backend/lambdas/order-processor/terraform
}

run_lambda_payment() {
  build_lambda_images
  run_terraform_stack backend/lambdas/payment-processor/terraform
}

run_lambda_notification() {
  build_lambda_images
  run_terraform_stack backend/lambdas/notification-sender/terraform
}

print_endpoints() {
  log ""
  log "LocalStack endpoints:"
  log "  Frontend:       https://${WORKSPACE_NAME}-app.${DOMAIN_NAME}"
  log "  API:            https://${WORKSPACE_NAME}-api.${DOMAIN_NAME}"
  log "  API health:     https://${WORKSPACE_NAME}-api.${DOMAIN_NAME}/actuator/health"
  log "  Frontend S3:    https://localhost.localstack.cloud:4566/${WORKSPACE_NAME}-eventpro-site-frontend/index.html"
  log "  LocalStack API: ${AWS_ENDPOINT_URL}"
  log ""
  log "Fetch examples:"
  log "  curl -k --http1.1 https://${WORKSPACE_NAME}-api.${DOMAIN_NAME}/actuator/health"
  log "  aws --endpoint-url=\"${AWS_ENDPOINT_URL}\" s3 ls"
}

if [ "$START_LOCALSTACK" = true ]; then
  start_localstack
fi

if [ "$START_ONLY" = true ]; then
  exit 0
fi

if [ "$PRINT_ENDPOINTS_ONLY" = true ]; then
  print_endpoints
  exit 0
fi

check_localstack

if [ "$BOOTSTRAP_STATE_ONLY" = true ]; then
  bootstrap_state_bucket
  exit 0
fi

if [ "$BOOTSTRAP_ROUTE53_ONLY" = true ]; then
  bootstrap_route53_zone
  exit 0
fi

bootstrap_state_bucket
bootstrap_route53_zone

case "$ONLY" in
  all)
    if [ "$ACTION" = "destroy" ]; then
      run_terraform_stack eventpro-frontend/terraform
      build_lambda_images
      run_terraform_stack backend/lambdas/notification-sender/terraform
      run_terraform_stack backend/lambdas/payment-processor/terraform
      run_terraform_stack backend/lambdas/order-processor/terraform
      run_terraform_stack backend/services/terraform
      run_terraform_stack backend/shared-infra
    else
      run_shared_infra
      run_services
      run_frontend
      build_lambda_images
      run_terraform_stack backend/lambdas/order-processor/terraform
      run_terraform_stack backend/lambdas/payment-processor/terraform
      run_terraform_stack backend/lambdas/notification-sender/terraform
    fi
    ;;
  shared-infra)
    run_shared_infra
    ;;
  services)
    run_services
    ;;
  frontend)
    run_frontend
    ;;
  lambdas)
    build_lambda_images
    if [ "$ACTION" = "destroy" ]; then
      run_terraform_stack backend/lambdas/notification-sender/terraform
      run_terraform_stack backend/lambdas/payment-processor/terraform
      run_terraform_stack backend/lambdas/order-processor/terraform
    else
      run_terraform_stack backend/lambdas/order-processor/terraform
      run_terraform_stack backend/lambdas/payment-processor/terraform
      run_terraform_stack backend/lambdas/notification-sender/terraform
    fi
    ;;
  order-processor)
    run_lambda_order
    ;;
  payment-processor)
    run_lambda_payment
    ;;
  notification-sender)
    run_lambda_notification
    ;;
esac

if [ "$ACTION" = "apply" ]; then
  print_endpoints
fi
