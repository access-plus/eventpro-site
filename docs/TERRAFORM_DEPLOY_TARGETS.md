# Terraform Deploy Targets: AWS and LocalStack Pro

This repository supports two Terraform deploy targets from the same component stacks:

- Real AWS cloud.
- LocalStack Pro full AWS emulation.

The target is selected by the combination of:

- Terraform backend init config.
- Terraform variable file.
- AWS endpoint/credential environment.

Do not mix AWS and LocalStack state in the same initialized `.terraform` directory. Re-run `terraform init -reconfigure` whenever switching targets.

## Stack Order

Always deploy in this order:

```text
backend/shared-infra
  -> backend/services/terraform
  -> eventpro-frontend/terraform
  -> backend/lambdas/order-processor/terraform
  -> backend/lambdas/payment-processor/terraform
  -> backend/lambdas/notification-sender/terraform
```

`shared-infra` is the only upstream state. Services, frontend, and lambdas read only `shared-infra/terraform.tfstate`.

## Real AWS Cloud

Use `.env.remote`, the normal backend config in each stack's `versions.tf`, and the normal higher-environment variables.

```bash
set -a
source .env.remote
set +a
```

Example for shared infra:

```bash
cd backend/shared-infra
terraform init -reconfigure
terraform workspace select "$WORKSPACE" || terraform workspace new "$WORKSPACE"
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

Example for services:

```bash
cd backend/services/terraform
terraform init -reconfigure
terraform workspace select "$WORKSPACE" || terraform workspace new "$WORKSPACE"
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

For the frontend stack, keep using the CI/script backend values or pass the real AWS backend explicitly:

```bash
cd eventpro-frontend/terraform
terraform init -reconfigure \
  -backend-config=bucket=eventpro-site-state \
  -backend-config=key=frontend/terraform.tfstate \
  -backend-config=region=us-east-1 \
  -backend-config=use_lockfile=true
terraform workspace select "$WORKSPACE" || terraform workspace new "$WORKSPACE"
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

Real AWS rules:

- `use_localstack` must be `false` or omitted.
- Do not pass `backend.lstk.tfbackend`.
- Do not pass `terraform.lstk.tfvars`.
- Use real AWS credentials/profile/environment from `.env.remote` and your local AWS profile/session.
- The S3 backend bucket must be the real AWS state bucket.

## LocalStack Pro

LocalStack Pro requires both provider endpoint overrides and S3 backend endpoint overrides.

Provider switching is handled by `terraform.lstk.tfvars`:

```hcl
use_localstack      = true
localstack_endpoint = "http://localhost:4566"
```

Backend switching is handled by `backend.lstk.tfbackend` in each Terraform stack. This is required because Terraform backend blocks cannot read variables.

The committed LocalStack files use `http://localhost:4566` with S3 path-style access. If your environment depends on LocalStack wildcard DNS, replace that value with `http://localhost.localstack.cloud:4566` in both `terraform.lstk.tfvars` and `backend.lstk.tfbackend`.

Before running Terraform, load `.env.lstk`, start LocalStack Pro, and create the emulated state bucket:

```bash
set -a
source .env.lstk
set +a

: "${LOCALSTACK_AUTH_TOKEN:?Set LOCALSTACK_AUTH_TOKEN for LocalStack Pro}"
lstk start

AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}" \
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}" \
AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}" \
aws --endpoint-url="${AWS_ENDPOINT_URL:-http://localhost:4566}" s3 mb s3://eventpro-site-state
```

If you start LocalStack with `make lstk-start`, Make sources `.env.lstk` only inside its own subshell. Source `.env.lstk` in your current shell before manual `aws` commands, or use `make lstk-state-bucket`.

Make shortcuts wrap the same backend and var-file settings:

```bash
make lstk-start
make lstk-state-bucket
make lstk-tf-all                 # defaults to plan
make lstk-tf-all LSTK_TF_ACTION=apply
```

Apply shared infra first:

```bash
cd backend/shared-infra
terraform init -reconfigure -backend-config=backend.lstk.tfbackend
terraform workspace select "$WORKSPACE" || terraform workspace new "$WORKSPACE"
terraform plan -var-file=terraform.lstk.tfvars
terraform apply -var-file=terraform.lstk.tfvars
```

Then apply each downstream stack with its own LocalStack backend config and LocalStack variable file:

```bash
cd backend/services/terraform
terraform init -reconfigure -backend-config=backend.lstk.tfbackend
terraform workspace select "$WORKSPACE" || terraform workspace new "$WORKSPACE"
terraform plan -var-file=terraform.lstk.tfvars
terraform apply -var-file=terraform.lstk.tfvars
```

```bash
cd eventpro-frontend/terraform
terraform init -reconfigure -backend-config=backend.lstk.tfbackend
terraform workspace select "$WORKSPACE" || terraform workspace new "$WORKSPACE"
terraform plan -var-file=terraform.lstk.tfvars
terraform apply -var-file=terraform.lstk.tfvars
```

```bash
cd backend/lambdas/order-processor/terraform
terraform init -reconfigure -backend-config=backend.lstk.tfbackend
terraform workspace select "$WORKSPACE" || terraform workspace new "$WORKSPACE"
terraform plan -var-file=terraform.lstk.tfvars
terraform apply -var-file=terraform.lstk.tfvars
```

Repeat the same two commands for:

- `backend/lambdas/payment-processor/terraform`
- `backend/lambdas/notification-sender/terraform`

LocalStack Pro rules:

- Use `terraform.lstk.tfvars`.
- Use `backend.lstk.tfbackend`.
- Load `.env.lstk` before running commands.
- Keep the same Terraform workspace across all stacks.
- Create the LocalStack S3 state bucket before `terraform init`.
- Do not use the real AWS `terraform.tfvars` when deploying to LocalStack.

## Why There Are Two LocalStack Files

`terraform.lstk.tfvars` controls resource providers and normal Terraform variables.

`backend.lstk.tfbackend` controls Terraform's own S3 backend. Terraform initializes the backend before variables are loaded, so backend endpoint settings cannot live in `terraform.lstk.tfvars`.

## Switching Targets Safely

From AWS to LocalStack Pro:

```bash
terraform init -reconfigure -backend-config=backend.lstk.tfbackend
terraform plan -var-file=terraform.lstk.tfvars
```

From LocalStack Pro back to AWS:

```bash
terraform init -reconfigure
terraform plan -var-file=terraform.tfvars
```

If Terraform asks to migrate state while switching targets, stop unless you intentionally want to copy state between AWS and LocalStack. In most local emulation workflows, choose reconfiguration only, not migration.

## Provider Details

When `use_localstack = true`, the AWS providers use:

- Mock AWS credentials.
- `s3_use_path_style = true`.
- Credential, metadata, region, and account-ID validation skips.
- Explicit service endpoints pointed at `localstack_endpoint`.

Downstream `terraform_remote_state.shared_infra` also switches to LocalStack S3 by using:

- Mock AWS credentials.
- S3 path-style access.
- S3/STS endpoints pointed at `localstack_endpoint`.
- S3 checksum skipping for S3-compatible backend behavior.

This keeps the dependency rule intact: downstream stacks still have only one dependency, `shared-infra`, regardless of whether the target is AWS or LocalStack Pro.
