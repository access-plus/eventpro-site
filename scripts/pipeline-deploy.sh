#!/usr/bin/env bash
# Local pipeline-mimic deploy script (shared-infra -> services -> frontend -> lambdas)
# Mirrors the GitHub workflows' image variable format: image_registry/image_name/image_tag.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AWS_REGION="${AWS_REGION:-us-east-1}"
WORKSPACE="${WORKSPACE:-dev}"
ACTION="apply" # plan|apply

RUN_SHARED_INFRA=true
RUN_SERVICES=true
RUN_FRONTEND=true
RUN_LAMBDAS=true
LAMBDA_TARGETS_CSV="order-processor,payment-processor,notification-sender"
ONLY_COMPONENTS=""
SKIP_COMPONENTS=""

SERVICES_IMAGE_SOURCE="${SERVICES_IMAGE_SOURCE:-build}"  # build|existing
SERVICES_IMAGE_PLATFORMS="${SERVICES_IMAGE_PLATFORMS:-${SERVICES_IMAGE_PLATFORM:-linux/amd64,linux/arm64}}"
LAMBDAS_IMAGE_SOURCE="${LAMBDAS_IMAGE_SOURCE:-build}"    # build|existing
ORDER_PROCESSOR_IMAGE_SOURCE="${ORDER_PROCESSOR_IMAGE_SOURCE:-}"
PAYMENT_PROCESSOR_IMAGE_SOURCE="${PAYMENT_PROCESSOR_IMAGE_SOURCE:-}"
NOTIFICATION_SENDER_IMAGE_SOURCE="${NOTIFICATION_SENDER_IMAGE_SOURCE:-}"

GLOBAL_IMAGE_TAG="${IMAGE_TAG:-}"
OVERRIDE_SERVICES_IMAGE_TAG=""
OVERRIDE_ORDER_PROCESSOR_IMAGE_TAG=""
OVERRIDE_PAYMENT_PROCESSOR_IMAGE_TAG=""
OVERRIDE_NOTIFICATION_SENDER_IMAGE_TAG=""

ECR_REGISTRY="${ECR_REGISTRY:-}"
PUSH_IMAGES=true
PUSH_IMAGES_SET=false
ECR_LOGGED_IN=false

FRONTEND_SYNC=true
FRONTEND_INVALIDATE=true

ENV_FILES=()

GREEN=''
YELLOW=''
RED=''
NC=''
if [ -t 1 ]; then
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  RED='\033[0;31m'
  NC='\033[0m'
fi

log() { printf '%b\n' "$*"; }
warn() { printf '%b\n' "${YELLOW}Warning:${NC} $*"; }
err() { printf '%b\n' "${RED}Error:${NC} $*" >&2; }
die() { err "$*"; exit 1; }

usage() {
  cat <<USAGE
Usage:
  ./scripts/pipeline-deploy.sh [options]

What it does (in order):
  1) shared-infra (terraform)
  2) services (build image + terraform) [optional existing image mode]
  3) frontend (npm build + terraform + S3 sync + CloudFront invalidation)
  4) lambdas (order, payment, notification) [optional existing image mode]

Modes:
  --plan                 Run terraform plan for selected stacks (no S3 sync/invalidation)
  --apply                Run terraform apply -auto-approve (default)

Common options:
  --workspace NAME       Terraform workspace (default: dev)
  --env-file PATH        Source shell-compatible env file (repeatable)
  --only CSV             Components to run: shared-infra,services,frontend,lambdas (or all)
  --skip CSV             Components to skip: shared-infra,services,frontend,lambdas
  --lambdas CSV          Lambda subset: order-processor,payment-processor,notification-sender
  --image-tag TAG        Default build tag for all built images (defaults to sha-<gitsha>)
  --ecr-registry HOST    ECR registry host (e.g. 123...dkr.ecr.us-east-1.amazonaws.com)
  --push-images          Push built images (default for apply)
  --no-push-images       Do not push built images (default for plan)

Image source control:
  --services-image-source build|existing       (default: build)
  --lambdas-image-source build|existing        (default: build)
  --order-processor-image-source build|existing
  --payment-processor-image-source build|existing
  --notification-sender-image-source build|existing

Per-component build tag overrides:
  --services-image-tag TAG
  --order-processor-image-tag TAG
  --payment-processor-image-tag TAG
  --notification-sender-image-tag TAG

Frontend deploy options:
  --no-frontend-sync          Skip aws s3 sync (apply mode only)
  --no-frontend-invalidate    Skip CloudFront invalidation (apply mode only)

Required env vars (services/frontend):
  DOMAIN_NAME

Image vars for existing-image mode (pipeline-style triplets):
  Services:
    SERVICES_IMAGE_REGISTRY, SERVICES_IMAGE_NAME (optional, defaults to eventpro-api), SERVICES_IMAGE_TAG
  Order lambda:
    ORDER_PROCESSOR_IMAGE_REGISTRY, ORDER_PROCESSOR_IMAGE_NAME (optional), ORDER_PROCESSOR_IMAGE_TAG
  Payment lambda:
    PAYMENT_PROCESSOR_IMAGE_REGISTRY, PAYMENT_PROCESSOR_IMAGE_NAME (optional), PAYMENT_PROCESSOR_IMAGE_TAG
  Notification lambda:
    NOTIFICATION_SENDER_IMAGE_REGISTRY, NOTIFICATION_SENDER_IMAGE_NAME (optional), NOTIFICATION_SENDER_IMAGE_TAG

Optional env vars passed to Terraform when set:
  STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
  JWT_ISSUER, JWT_ACCESS_TTL_SECONDS, JWT_PUBLIC_KEY, JWT_PRIVATE_KEY
  JWT_PUBLIC_KEY_FILE, JWT_PRIVATE_KEY_FILE   (script reads file content into JWT_* vars)
  NEW_RELIC_LICENSE_KEY (legacy alias: NEWRELIC_LICENSE_KEY)
  NEW_RELIC_ACCOUNT_ID (legacy alias: NEW_RELIC_TRUSTED_ACCOUNT_KEY)
  SES_SENDER_EMAIL
  VITE_API_BASE_URL

Build behavior env vars:
  SERVICES_IMAGE_PLATFORMS  Docker build platforms for services image in build mode (default: linux/amd64,linux/arm64)
  SERVICES_IMAGE_PLATFORM   Legacy alias for single-platform builds (fallback only)
  LAMBDA_IMAGE_PLATFORM     Docker platform for Lambda images in build mode (default: linux/amd64)

Notes:
  - Frontend Terraform backend config is intentionally hardcoded to match CI.
  - Services and lambda Terraform backends use the hardcoded backend blocks in each stack.
  - AWS credentials/profile are expected to already be configured locally.
USAGE
}

preload_env_files() {
  local i=1
  while [ $i -le $# ]; do
    eval "arg=\${$i}"
    case "$arg" in
      --env-file)
        i=$((i + 1))
        [ $i -le $# ] || die "Missing value for --env-file"
        eval "env_file=\${$i}"
        ENV_FILES+=("$env_file")
        ;;
      --env-file=*)
        ENV_FILES+=("${arg#*=}")
        ;;
    esac
    i=$((i + 1))
  done
}

load_env_files() {
  local idx file
  if [ "${#ENV_FILES[@]}" -eq 0 ]; then
    return 0
  fi
  for ((idx = 0; idx < ${#ENV_FILES[@]}; idx++)); do
    file="${ENV_FILES[$idx]}"
    [ -f "$file" ] || die "Env file not found: $file"
    log "${GREEN}Loading env file:${NC} $file"
    set -a
    # shellcheck disable=SC1090
    . "$file"
    set +a
  done
}

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --workspace)
        [ $# -ge 2 ] || die "Missing value for --workspace"
        WORKSPACE="$2"
        shift 2
        ;;
      --plan)
        ACTION="plan"
        shift
        ;;
      --apply)
        ACTION="apply"
        shift
        ;;
      --env-file)
        [ $# -ge 2 ] || die "Missing value for --env-file"
        shift 2
        ;;
      --env-file=*)
        shift
        ;;
      --only)
        [ $# -ge 2 ] || die "Missing value for --only"
        ONLY_COMPONENTS="$2"
        shift 2
        ;;
      --skip)
        [ $# -ge 2 ] || die "Missing value for --skip"
        SKIP_COMPONENTS="$2"
        shift 2
        ;;
      --lambdas)
        [ $# -ge 2 ] || die "Missing value for --lambdas"
        LAMBDA_TARGETS_CSV="$2"
        shift 2
        ;;
      --image-tag)
        [ $# -ge 2 ] || die "Missing value for --image-tag"
        GLOBAL_IMAGE_TAG="$2"
        shift 2
        ;;
      --services-image-tag)
        [ $# -ge 2 ] || die "Missing value for --services-image-tag"
        OVERRIDE_SERVICES_IMAGE_TAG="$2"
        shift 2
        ;;
      --order-processor-image-tag)
        [ $# -ge 2 ] || die "Missing value for --order-processor-image-tag"
        OVERRIDE_ORDER_PROCESSOR_IMAGE_TAG="$2"
        shift 2
        ;;
      --payment-processor-image-tag)
        [ $# -ge 2 ] || die "Missing value for --payment-processor-image-tag"
        OVERRIDE_PAYMENT_PROCESSOR_IMAGE_TAG="$2"
        shift 2
        ;;
      --notification-sender-image-tag)
        [ $# -ge 2 ] || die "Missing value for --notification-sender-image-tag"
        OVERRIDE_NOTIFICATION_SENDER_IMAGE_TAG="$2"
        shift 2
        ;;
      --ecr-registry)
        [ $# -ge 2 ] || die "Missing value for --ecr-registry"
        ECR_REGISTRY="$2"
        shift 2
        ;;
      --push-images)
        PUSH_IMAGES=true
        PUSH_IMAGES_SET=true
        shift
        ;;
      --no-push-images)
        PUSH_IMAGES=false
        PUSH_IMAGES_SET=true
        shift
        ;;
      --services-image-source)
        [ $# -ge 2 ] || die "Missing value for --services-image-source"
        SERVICES_IMAGE_SOURCE="$2"
        shift 2
        ;;
      --lambdas-image-source)
        [ $# -ge 2 ] || die "Missing value for --lambdas-image-source"
        LAMBDAS_IMAGE_SOURCE="$2"
        shift 2
        ;;
      --order-processor-image-source)
        [ $# -ge 2 ] || die "Missing value for --order-processor-image-source"
        ORDER_PROCESSOR_IMAGE_SOURCE="$2"
        shift 2
        ;;
      --payment-processor-image-source)
        [ $# -ge 2 ] || die "Missing value for --payment-processor-image-source"
        PAYMENT_PROCESSOR_IMAGE_SOURCE="$2"
        shift 2
        ;;
      --notification-sender-image-source)
        [ $# -ge 2 ] || die "Missing value for --notification-sender-image-source"
        NOTIFICATION_SENDER_IMAGE_SOURCE="$2"
        shift 2
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
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

trim_csv_item() {
  # shell-only trim for simple CSV values
  local s="$1"
  s="${s#${s%%[![:space:]]*}}"
  s="${s%${s##*[![:space:]]}}"
  printf '%s' "$s"
}

csv_contains() {
  local csv="$1"
  local target="$2"
  local old_ifs="$IFS"
  local item
  IFS=','
  for item in $csv; do
    item="$(trim_csv_item "$item")"
    if [ "$item" = "$target" ]; then
      IFS="$old_ifs"
      return 0
    fi
    if [ "$item" = "all" ]; then
      IFS="$old_ifs"
      return 0
    fi
  done
  IFS="$old_ifs"
  return 1
}

apply_component_filters() {
  if [ -n "$ONLY_COMPONENTS" ]; then
    RUN_SHARED_INFRA=false
    RUN_SERVICES=false
    RUN_FRONTEND=false
    RUN_LAMBDAS=false
    csv_contains "$ONLY_COMPONENTS" "shared-infra" && RUN_SHARED_INFRA=true
    csv_contains "$ONLY_COMPONENTS" "services" && RUN_SERVICES=true
    csv_contains "$ONLY_COMPONENTS" "frontend" && RUN_FRONTEND=true
    csv_contains "$ONLY_COMPONENTS" "lambdas" && RUN_LAMBDAS=true
  fi

  if [ -n "$SKIP_COMPONENTS" ]; then
    csv_contains "$SKIP_COMPONENTS" "shared-infra" && RUN_SHARED_INFRA=false
    csv_contains "$SKIP_COMPONENTS" "services" && RUN_SERVICES=false
    csv_contains "$SKIP_COMPONENTS" "frontend" && RUN_FRONTEND=false
    csv_contains "$SKIP_COMPONENTS" "lambdas" && RUN_LAMBDAS=false
  fi
}

validate_sources() {
  case "$SERVICES_IMAGE_SOURCE" in build|existing) ;; *) die "Invalid SERVICES_IMAGE_SOURCE: $SERVICES_IMAGE_SOURCE" ;; esac
  case "$LAMBDAS_IMAGE_SOURCE" in build|existing) ;; *) die "Invalid LAMBDAS_IMAGE_SOURCE: $LAMBDAS_IMAGE_SOURCE" ;; esac
  if [ -n "$ORDER_PROCESSOR_IMAGE_SOURCE" ]; then case "$ORDER_PROCESSOR_IMAGE_SOURCE" in build|existing) ;; *) die "Invalid ORDER_PROCESSOR_IMAGE_SOURCE" ;; esac; fi
  if [ -n "$PAYMENT_PROCESSOR_IMAGE_SOURCE" ]; then case "$PAYMENT_PROCESSOR_IMAGE_SOURCE" in build|existing) ;; *) die "Invalid PAYMENT_PROCESSOR_IMAGE_SOURCE" ;; esac; fi
  if [ -n "$NOTIFICATION_SENDER_IMAGE_SOURCE" ]; then case "$NOTIFICATION_SENDER_IMAGE_SOURCE" in build|existing) ;; *) die "Invalid NOTIFICATION_SENDER_IMAGE_SOURCE" ;; esac; fi
}

read_file_var_if_needed() {
  local value_var="$1"
  local file_var="$2"
  local value="${!value_var-}"
  local file_path="${!file_var-}"
  if [ -z "$value" ] && [ -n "$file_path" ]; then
    [ -f "$file_path" ] || die "$file_var points to missing file: $file_path"
    value="$(cat "$file_path")"
    export "$value_var=$value"
  fi
}

git_short_sha() {
  (cd "$ROOT_DIR" && git rev-parse --short=12 HEAD 2>/dev/null) || date +%s
}

GIT_SHA_12=""
SHA_IMAGE_TAG=""

init_git_sha() {
  local sha
  sha="$(git_short_sha)"
  sha="${sha#sha-}"
  GIT_SHA_12="$sha"
  SHA_IMAGE_TAG="sha-${sha}"
}

resolve_primary_image_tag() {
  local component="$1"
  local override_tag=""
  local env_component_tag=""

  case "$component" in
    services)
      override_tag="$OVERRIDE_SERVICES_IMAGE_TAG"
      env_component_tag="${SERVICES_IMAGE_TAG:-}"
      ;;
    order-processor)
      override_tag="$OVERRIDE_ORDER_PROCESSOR_IMAGE_TAG"
      env_component_tag="${ORDER_PROCESSOR_IMAGE_TAG:-}"
      ;;
    payment-processor)
      override_tag="$OVERRIDE_PAYMENT_PROCESSOR_IMAGE_TAG"
      env_component_tag="${PAYMENT_PROCESSOR_IMAGE_TAG:-}"
      ;;
    notification-sender)
      override_tag="$OVERRIDE_NOTIFICATION_SENDER_IMAGE_TAG"
      env_component_tag="${NOTIFICATION_SENDER_IMAGE_TAG:-}"
      ;;
    *) die "Unsupported component for tag resolution: $component" ;;
  esac

  if [ -n "$override_tag" ]; then
    printf '%s' "$override_tag"
    return 0
  fi
  if [ -n "$GLOBAL_IMAGE_TAG" ]; then
    printf '%s' "$GLOBAL_IMAGE_TAG"
    return 0
  fi
  if [ -n "$env_component_tag" ] && [ "$env_component_tag" != "REPLACE_ME" ]; then
    printf '%s' "$env_component_tag"
    return 0
  fi
  printf '%s' "$SHA_IMAGE_TAG"
}

resolve_extra_sha_tag_if_release() {
  local primary_tag="$1"
  if [[ "$primary_tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+([-.+][0-9A-Za-z.-]+)?$ ]] && [ "$primary_tag" != "$SHA_IMAGE_TAG" ]; then
    printf '%s' "$SHA_IMAGE_TAG"
    return 0
  fi
  return 1
}

need_any_image_build() {
  if [ "$RUN_SERVICES" = true ] && [ "$SERVICES_IMAGE_SOURCE" = "build" ]; then
    return 0
  fi
  if [ "$RUN_LAMBDAS" = true ]; then
    if [ "$(lambda_image_source_for order-processor)" = "build" ] && csv_contains "$LAMBDA_TARGETS_CSV" order-processor; then return 0; fi
    if [ "$(lambda_image_source_for payment-processor)" = "build" ] && csv_contains "$LAMBDA_TARGETS_CSV" payment-processor; then return 0; fi
    if [ "$(lambda_image_source_for notification-sender)" = "build" ] && csv_contains "$LAMBDA_TARGETS_CSV" notification-sender; then return 0; fi
  fi
  return 1
}

resolve_ecr_registry_if_needed() {
  if ! need_any_image_build; then
    return 0
  fi

  if [ -n "$ECR_REGISTRY" ]; then
    return 0
  fi

  if [ -n "${AWS_ACCOUNT_ID:-}" ]; then
    ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    return 0
  fi

  require_cmd aws
  local account_id
  account_id="$(aws sts get-caller-identity --query Account --output text)"
  [ -n "$account_id" ] || die "Could not determine AWS account ID for ECR registry discovery"
  ECR_REGISTRY="${account_id}.dkr.ecr.${AWS_REGION}.amazonaws.com"
}

login_ecr_if_needed() {
  if [ "$ECR_LOGGED_IN" = true ]; then
    return 0
  fi
  require_cmd aws
  require_cmd docker
  [ -n "$ECR_REGISTRY" ] || die "ECR_REGISTRY is required for image build mode"
  log "${GREEN}Logging in to ECR:${NC} ${ECR_REGISTRY}"
  aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY" >/dev/null
  ECR_LOGGED_IN=true
}

run_gradle_build_no_tests() {
  local dir="$1"
  log "${GREEN}Gradle build (no tests):${NC} $dir"
  (
    cd "$ROOT_DIR/$dir"
    ./gradlew clean build -x test
  )
}

build_service_image() {
  local primary_tag="$1"
  local extra_tag="${2:-}"
  local repo_name="eventpro-api"
  local primary_ref="${ECR_REGISTRY}/${repo_name}:${primary_tag}"
  local build_platform_for_local_load="${SERVICES_IMAGE_PLATFORMS}"

  require_cmd docker
  if [ "$PUSH_IMAGES" = true ]; then
    docker buildx version >/dev/null 2>&1 || die "docker buildx is required for multi-platform services image builds"
    login_ecr_if_needed

    log "${GREEN}Building & pushing services API image:${NC} ${primary_ref} (platforms=${SERVICES_IMAGE_PLATFORMS})"
    (
      cd "$ROOT_DIR"
      if [ -n "$extra_tag" ]; then
        docker buildx build \
          --platform "$SERVICES_IMAGE_PLATFORMS" \
          -f backend/services/Dockerfile \
          -t "$primary_ref" \
          -t "${ECR_REGISTRY}/${repo_name}:${extra_tag}" \
          backend \
          --push
      else
        docker buildx build \
          --platform "$SERVICES_IMAGE_PLATFORMS" \
          -f backend/services/Dockerfile \
          -t "$primary_ref" \
          backend \
          --push
      fi
    )
  else
    if [[ "$build_platform_for_local_load" == *,* ]]; then
      build_platform_for_local_load="${build_platform_for_local_load%%,*}"
      build_platform_for_local_load="$(trim_csv_item "$build_platform_for_local_load")"
      warn "PUSH_IMAGES=false cannot load a multi-platform manifest locally; building only ${build_platform_for_local_load}"
    fi

    log "${GREEN}Building services API image:${NC} ${primary_ref} (platform=${build_platform_for_local_load})"
    (
      cd "$ROOT_DIR"
      docker image build --platform "$build_platform_for_local_load" -f backend/services/Dockerfile -t "$primary_ref" backend
    )

    if [ -n "$extra_tag" ]; then
      docker image tag "$primary_ref" "${ECR_REGISTRY}/${repo_name}:${extra_tag}"
    fi
  fi

  if [ "$PUSH_IMAGES" = false ]; then
    warn "Skipping push for services image (PUSH_IMAGES=false)"
  fi

  SERVICES_IMAGE_REGISTRY="$ECR_REGISTRY"
  SERVICES_IMAGE_NAME="$repo_name"
  SERVICES_IMAGE_TAG="$primary_tag"
}

require_var() {
  local name="$1"
  local value="${!name-}"
  [ -n "$value" ] || die "Required variable is missing: $name"
}

terraform_init() {
  local tf_dir="$1"
  if [ "$tf_dir" = "eventpro-frontend/terraform" ]; then
    (
      cd "$ROOT_DIR/$tf_dir"
      terraform init -upgrade \
        -backend-config=bucket=eventpro-site-state \
        -backend-config=key=frontend/terraform.tfstate \
        -backend-config=region=us-east-1 \
        -backend-config=use_lockfile=true
    )
  else
    (
      cd "$ROOT_DIR/$tf_dir"
      terraform init -upgrade
    )
  fi
}

terraform_select_workspace() {
  local tf_dir="$1"
  (
    cd "$ROOT_DIR/$tf_dir"
    terraform workspace select "$WORKSPACE" >/dev/null 2>&1 || terraform workspace new "$WORKSPACE" >/dev/null
  )
}

# Extra args are passed to terraform plan/apply (e.g. -var=...). CLI -var has highest
# precedence and overrides both TF_VAR_* and terraform.tfvars — needed when local
# **/*.tfvars (often gitignored) still contain placeholders like REPLACE_ME.
terraform_validate_and_run() {
  local tf_dir="$1"
  shift
  (
    cd "$ROOT_DIR/$tf_dir"
    terraform validate
    if [ "$ACTION" = "plan" ]; then
      terraform plan "$@"
    else
      terraform apply -auto-approve "$@"
    fi
  )
}

terraform_output_raw() {
  local tf_dir="$1"
  local output_name="$2"
  (
    cd "$ROOT_DIR/$tf_dir"
    terraform output -raw "$output_name"
  )
}

prepare_stack() {
  local tf_dir="$1"
  log "${GREEN}Terraform init:${NC} $tf_dir"
  terraform_init "$tf_dir"
  log "${GREEN}Terraform workspace:${NC} $WORKSPACE ($tf_dir)"
  terraform_select_workspace "$tf_dir"
}

run_shared_infra_stack() {
  log "${GREEN}Deploying shared infrastructure stack${NC}"

  require_var DOMAIN_NAME

  prepare_stack backend/shared-infra
  (
    export TF_VAR_domain_name="$DOMAIN_NAME"

    terraform_validate_and_run backend/shared-infra \
      -var="domain_name=${DOMAIN_NAME}"
  )
}

run_services_stack() {
  log "${GREEN}Deploying services stack${NC}"

  require_var DOMAIN_NAME

  if [ "$SERVICES_IMAGE_SOURCE" = "build" ]; then
    local primary_tag extra_tag
    primary_tag="$(resolve_primary_image_tag services)"
    extra_tag="$(resolve_extra_sha_tag_if_release "$primary_tag" || true)"
    run_gradle_build_no_tests backend/services
    build_service_image "$primary_tag" "$extra_tag"
  else
    require_var SERVICES_IMAGE_REGISTRY
    SERVICES_IMAGE_NAME="${SERVICES_IMAGE_NAME:-eventpro-api}"
    require_var SERVICES_IMAGE_TAG
    [ "$SERVICES_IMAGE_TAG" != "REPLACE_ME" ] || die "SERVICES_IMAGE_TAG cannot be REPLACE_ME in existing-image mode"
  fi

  prepare_stack backend/services/terraform
  (
    export TF_VAR_image_registry="$SERVICES_IMAGE_REGISTRY"
    export TF_VAR_image_name="$SERVICES_IMAGE_NAME"
    export TF_VAR_image_tag="$SERVICES_IMAGE_TAG"
    export TF_VAR_domain_name="$DOMAIN_NAME"

    [ -n "${STRIPE_SECRET_KEY:-}" ] && export TF_VAR_stripe_secret_key="$STRIPE_SECRET_KEY"
    [ -n "${STRIPE_PUBLISHABLE_KEY:-}" ] && export TF_VAR_stripe_publishable_key="$STRIPE_PUBLISHABLE_KEY"
    [ -n "${STRIPE_WEBHOOK_SECRET:-}" ] && export TF_VAR_stripe_webhook_secret="$STRIPE_WEBHOOK_SECRET"
    [ -n "${JWT_ISSUER:-}" ] && export TF_VAR_jwt_issuer="$JWT_ISSUER"
    [ -n "${JWT_ACCESS_TTL_SECONDS:-}" ] && export TF_VAR_jwt_access_ttl_seconds="$JWT_ACCESS_TTL_SECONDS"
    [ -n "${JWT_PUBLIC_KEY:-}" ] && export TF_VAR_jwt_public_key="$JWT_PUBLIC_KEY"
    [ -n "${JWT_PRIVATE_KEY:-}" ] && export TF_VAR_jwt_private_key="$JWT_PRIVATE_KEY"
    export TF_VAR_new_relic_license_key="$NEW_RELIC_LICENSE_KEY"

    terraform_validate_and_run backend/services/terraform \
      -var="image_registry=${SERVICES_IMAGE_REGISTRY}" \
      -var="image_name=${SERVICES_IMAGE_NAME}" \
      -var="image_tag=${SERVICES_IMAGE_TAG}" \
      -var="new_relic_license_key=${NEW_RELIC_LICENSE_KEY}"
  )
}

run_frontend_stack() {
  local vite_api_base_url bucket_name dist_id

  log "${GREEN}Deploying frontend stack${NC}"
  require_var DOMAIN_NAME

  require_cmd npm
  vite_api_base_url="${VITE_API_BASE_URL:-https://${WORKSPACE}-api.${DOMAIN_NAME}}"

  (
    cd "$ROOT_DIR/eventpro-frontend"
    log "${GREEN}npm ci (eventpro-frontend)${NC}"
    npm ci
    log "${GREEN}npm run build (eventpro-frontend)${NC}"
    VITE_API_BASE_URL="$vite_api_base_url" npm run build
  )

  prepare_stack eventpro-frontend/terraform
  (
    export TF_VAR_domain_name="$DOMAIN_NAME"
    terraform_validate_and_run eventpro-frontend/terraform \
      -var="domain_name=${DOMAIN_NAME}"
  )

  if [ "$ACTION" = "plan" ]; then
    log "${YELLOW}Skipping frontend S3 sync/invalidation in plan mode${NC}"
    return 0
  fi

  if [ "$FRONTEND_SYNC" = true ]; then
    bucket_name="$(terraform_output_raw eventpro-frontend/terraform bucket_name)"
    log "${GREEN}Syncing frontend dist to S3:${NC} s3://${bucket_name}/"
    (
      cd "$ROOT_DIR"
      aws s3 sync eventpro-frontend/dist/ "s3://${bucket_name}/" --delete
    )
  else
    warn "Skipping frontend S3 sync (--no-frontend-sync)"
  fi

  if [ "$FRONTEND_INVALIDATE" = true ]; then
    dist_id="$(terraform_output_raw eventpro-frontend/terraform distribution_id)"
    log "${GREEN}Creating CloudFront invalidation:${NC} ${dist_id}"
    aws cloudfront create-invalidation --distribution-id "$dist_id" --paths '/*' >/dev/null
  else
    warn "Skipping CloudFront invalidation (--no-frontend-invalidate)"
  fi
}

lambda_image_source_for() {
  local lambda="$1"
  case "$lambda" in
    order-processor)
      printf '%s' "${ORDER_PROCESSOR_IMAGE_SOURCE:-$LAMBDAS_IMAGE_SOURCE}"
      ;;
    payment-processor)
      printf '%s' "${PAYMENT_PROCESSOR_IMAGE_SOURCE:-$LAMBDAS_IMAGE_SOURCE}"
      ;;
    notification-sender)
      printf '%s' "${NOTIFICATION_SENDER_IMAGE_SOURCE:-$LAMBDAS_IMAGE_SOURCE}"
      ;;
    *) die "Unsupported lambda: $lambda" ;;
  esac
}

lambda_repo_name_for() {
  local lambda="$1"
  printf 'eventpro-%s' "$lambda"
}

lambda_gradle_dir_for() {
  local lambda="$1"
  printf 'backend/lambdas/%s' "$lambda"
}

lambda_tf_dir_for() {
  local lambda="$1"
  printf 'backend/lambdas/%s/terraform' "$lambda"
}

lambda_env_prefix_for() {
  echo "$1" | tr '[:lower:]-' '[:upper:]_'
}

resolve_lambda_tag_override() {
  local lambda="$1"
  case "$lambda" in
    order-processor) printf '%s' "$OVERRIDE_ORDER_PROCESSOR_IMAGE_TAG" ;;
    payment-processor) printf '%s' "$OVERRIDE_PAYMENT_PROCESSOR_IMAGE_TAG" ;;
    notification-sender) printf '%s' "$OVERRIDE_NOTIFICATION_SENDER_IMAGE_TAG" ;;
    *) die "Unsupported lambda: $lambda" ;;
  esac
}

resolve_lambda_image_triplet() {
  local lambda="$1"
  local source_mode prefix repo_name name_var reg_var tag_var
  local primary_tag extra_tag metadata_file

  source_mode="$(lambda_image_source_for "$lambda")"
  prefix="$(lambda_env_prefix_for "$lambda")"
  repo_name="$(lambda_repo_name_for "$lambda")"

  reg_var="${prefix}_IMAGE_REGISTRY"
  name_var="${prefix}_IMAGE_NAME"
  tag_var="${prefix}_IMAGE_TAG"

  if [ "$source_mode" = "build" ]; then
    primary_tag="$(resolve_lambda_tag_override "$lambda")"
    if [ -z "$primary_tag" ]; then
      primary_tag="$(resolve_primary_image_tag "$lambda")"
    fi
    extra_tag="$(resolve_extra_sha_tag_if_release "$primary_tag" || true)"

    run_gradle_build_no_tests "$(lambda_gradle_dir_for "$lambda")"

    metadata_file="$(mktemp)"
    if [ "$PUSH_IMAGES" = true ]; then
      if [ -n "$extra_tag" ]; then
        "$ROOT_DIR/scripts/build-lambda-images.sh" \
          --lambda "$lambda" \
          --tag "$primary_tag" \
          --registry "$ECR_REGISTRY" \
          --push \
          --no-latest-alias \
          --extra-tag "$extra_tag" \
          --metadata-file "$metadata_file"
      else
        "$ROOT_DIR/scripts/build-lambda-images.sh" \
          --lambda "$lambda" \
          --tag "$primary_tag" \
          --registry "$ECR_REGISTRY" \
          --push \
          --no-latest-alias \
          --metadata-file "$metadata_file"
      fi
    else
      if [ -n "$extra_tag" ]; then
        "$ROOT_DIR/scripts/build-lambda-images.sh" \
          --lambda "$lambda" \
          --tag "$primary_tag" \
          --registry "$ECR_REGISTRY" \
          --no-push \
          --no-latest-alias \
          --extra-tag "$extra_tag" \
          --metadata-file "$metadata_file"
      else
        "$ROOT_DIR/scripts/build-lambda-images.sh" \
          --lambda "$lambda" \
          --tag "$primary_tag" \
          --registry "$ECR_REGISTRY" \
          --no-push \
          --no-latest-alias \
          --metadata-file "$metadata_file"
      fi
    fi

    eval "$(grep -E '^[A-Z0-9_]+=' "$metadata_file")"
    rm -f "$metadata_file"

    # Export pipeline-style triplet vars for downstream Terraform calls.
    eval "$reg_var=\${${prefix}_IMAGE_REGISTRY}"
    eval "$name_var=\${${prefix}_IMAGE_NAME}"
    eval "$tag_var=\${${prefix}_IMAGE_TAG}"
  else
    eval "current_registry=\${$reg_var-}"
    eval "current_name=\${$name_var-}"
    eval "current_tag=\${$tag_var-}"
    if [ -z "$current_registry" ]; then
      die "${reg_var} is required when ${lambda} image source is 'existing'"
    fi
    if [ -z "$current_tag" ] || [ "$current_tag" = "REPLACE_ME" ]; then
      die "${tag_var} is required when ${lambda} image source is 'existing'"
    fi
    if [ -z "$current_name" ]; then
      eval "$name_var=$repo_name"
    fi
  fi
}

run_lambda_stack() {
  local lambda="$1"
  local prefix reg_var name_var tag_var tf_dir
  local image_registry image_name image_tag

  prefix="$(lambda_env_prefix_for "$lambda")"
  reg_var="${prefix}_IMAGE_REGISTRY"
  name_var="${prefix}_IMAGE_NAME"
  tag_var="${prefix}_IMAGE_TAG"

  resolve_lambda_image_triplet "$lambda"

  eval "image_registry=\${$reg_var}"
  eval "image_name=\${$name_var}"
  eval "image_tag=\${$tag_var}"
  tf_dir="$(lambda_tf_dir_for "$lambda")"

  log "${GREEN}Deploying lambda stack:${NC} $lambda"
  prepare_stack "$tf_dir"
  (
    export TF_VAR_image_registry="$image_registry"
    export TF_VAR_image_name="$image_name"
    export TF_VAR_image_tag="$image_tag"
    export TF_VAR_new_relic_license_key="$NEW_RELIC_LICENSE_KEY"
    export TF_VAR_new_relic_account_id="$NEW_RELIC_ACCOUNT_ID"

    tf_extra_args=(
      -var="image_registry=${image_registry}"
      -var="image_name=${image_name}"
      -var="image_tag=${image_tag}"
      -var="new_relic_license_key=${NEW_RELIC_LICENSE_KEY}"
      -var="new_relic_account_id=${NEW_RELIC_ACCOUNT_ID}"
    )

    if [ "$lambda" = "payment-processor" ]; then
      require_var STRIPE_SECRET_KEY
      export TF_VAR_stripe_secret_key="$STRIPE_SECRET_KEY"
      tf_extra_args+=(-var="stripe_secret_key=${STRIPE_SECRET_KEY}")
    fi

    if [ "$lambda" = "notification-sender" ] && [ -n "${SES_SENDER_EMAIL:-}" ]; then
      export TF_VAR_ses_sender_email="$SES_SENDER_EMAIL"
      tf_extra_args+=(-var="ses_sender_email=${SES_SENDER_EMAIL}")
    fi

    terraform_validate_and_run "$tf_dir" "${tf_extra_args[@]}"
  )
}

run_lambdas() {
  log "${GREEN}Deploying lambdas${NC}"
  csv_contains "$LAMBDA_TARGETS_CSV" order-processor && run_lambda_stack order-processor
  csv_contains "$LAMBDA_TARGETS_CSV" payment-processor && run_lambda_stack payment-processor
  csv_contains "$LAMBDA_TARGETS_CSV" notification-sender && run_lambda_stack notification-sender
}

normalize_new_relic_key() {
  if [ -z "${NEW_RELIC_LICENSE_KEY:-}" ] && [ -n "${NEWRELIC_LICENSE_KEY:-}" ]; then
    NEW_RELIC_LICENSE_KEY="$NEWRELIC_LICENSE_KEY"
  fi
  export NEW_RELIC_LICENSE_KEY="${NEW_RELIC_LICENSE_KEY:-}"
  NEW_RELIC_ACCOUNT_ID="${NEW_RELIC_ACCOUNT_ID:-${NEW_RELIC_TRUSTED_ACCOUNT_KEY:-}}"
  export NEW_RELIC_ACCOUNT_ID="${NEW_RELIC_ACCOUNT_ID:-}"
}

check_prereqs() {
  require_cmd terraform
  require_cmd aws
  if [ "$RUN_FRONTEND" = true ]; then
    require_cmd npm
  fi
  if need_any_image_build; then
    require_cmd docker
  fi
}

print_plan() {
  log "${GREEN}Pipeline Mimic Configuration${NC}"
  log "  Workspace: $WORKSPACE"
  log "  Action: $ACTION"
  log "  AWS_REGION: $AWS_REGION"
  log "  Components: shared-infra=$RUN_SHARED_INFRA services=$RUN_SERVICES frontend=$RUN_FRONTEND lambdas=$RUN_LAMBDAS"
  if [ "$RUN_LAMBDAS" = true ]; then
    log "  Lambda targets: $LAMBDA_TARGETS_CSV"
  fi
  log "  Services image source: $SERVICES_IMAGE_SOURCE"
  log "  Lambdas image source: $LAMBDAS_IMAGE_SOURCE (overrides: order=${ORDER_PROCESSOR_IMAGE_SOURCE:-<none>} payment=${PAYMENT_PROCESSOR_IMAGE_SOURCE:-<none>} notification=${NOTIFICATION_SENDER_IMAGE_SOURCE:-<none>})"
  if need_any_image_build; then
    log "  ECR registry: ${ECR_REGISTRY:-<auto>}"
    log "  Push images: $PUSH_IMAGES"
    if [ "$RUN_SERVICES" = true ] && [ "$SERVICES_IMAGE_SOURCE" = "build" ]; then
      log "  Services image platforms: $SERVICES_IMAGE_PLATFORMS"
    fi
  fi
  if [ "$RUN_FRONTEND" = true ]; then
    log "  Frontend sync: $FRONTEND_SYNC"
    log "  Frontend invalidation: $FRONTEND_INVALIDATE"
  fi
}

main() {
  preload_env_files "$@"
  load_env_files
  parse_args "$@"

  if [ "$ACTION" = "plan" ] && [ "$PUSH_IMAGES_SET" = false ]; then
    PUSH_IMAGES=false
  fi

  validate_sources
  apply_component_filters
  normalize_new_relic_key

  [ "$WORKSPACE" = "dev" ] || [ "$WORKSPACE" = "prod" ] || warn "Workspace '$WORKSPACE' is not one of the expected values (dev, prod)."

  init_git_sha
  read_file_var_if_needed JWT_PUBLIC_KEY JWT_PUBLIC_KEY_FILE
  read_file_var_if_needed JWT_PRIVATE_KEY JWT_PRIVATE_KEY_FILE
  resolve_ecr_registry_if_needed
  check_prereqs
  print_plan

  export AWS_REGION

  if [ "$RUN_SHARED_INFRA" = true ]; then
    run_shared_infra_stack
  fi

  if [ "$RUN_SERVICES" = true ]; then
    run_services_stack
  fi

  if [ "$RUN_FRONTEND" = true ]; then
    run_frontend_stack
  fi

  if [ "$RUN_LAMBDAS" = true ]; then
    run_lambdas
  fi

  log "${GREEN}Pipeline mimic completed.${NC}"
}

main "$@"
