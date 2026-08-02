# Terraform Deployment Targets

The same six Terraform stacks support real AWS and a complete LocalStack Pro environment. Use the target-specific command families rather than manually mixing credentials, endpoints, backends, or variable files.

## Canonical commands

| Target | Plan | Deploy | Verify | Destroy |
|---|---|---|---|---|
| AWS | `make aws-plan` | `make aws-deploy` | Existing AWS observability/checks | `make tf-destroy-all` |
| LocalStack Pro | `make lstk-plan` | `make lstk-deploy` | `make lstk-verify` | `make lstk-destroy` |

The stack order is:

```text
shared-infra
  -> API image in ECR -> services
  -> frontend
  -> Lambda images in ECR -> order -> payment -> notification
```

Destroy runs the reverse order and leaves the LocalStack state bucket and hosted zone in place.

## LocalStack Pro

Prerequisites are Docker, Terraform, AWS CLI, Node/npm, Java, `jq`, and a LocalStack Pro auth token. Keep the token in the shell:

```bash
export LOCALSTACK_AUTH_TOKEN=...
make lstk-init
make lstk-deploy
```

`lstk-init` creates `.env.lstk` from the sanitized example only when it is absent, generates ignored JWT keys only when needed, starts the pinned LocalStack image, and creates the emulated state bucket and Route53 zone. It never writes the auth token into the environment file.

LocalStack deployment guarantees:

- Workspace `lstk`, account `000000000000`, region `us-east-1`, and mock AWS credentials.
- Host Terraform endpoint `http://localhost:4566`.
- ECS/Lambda runtime endpoint `http://localhost.localstack.cloud:4566`.
- Browser-facing S3 endpoint `https://localhost.localstack.cloud:4566`.
- `backend.lstk.tfbackend` plus the committed sanitized `terraform.lstk.tfvars` for every stack.
- LocalStack-owned ECR repositories and `linux/amd64` API/Lambda images.
- New Relic disabled and non-live Stripe sentinel keys.

On a pristine environment, `make lstk-plan` can only plan shared infrastructure because downstream stacks consume shared remote-state outputs. After the first `make lstk-deploy`, it plans all six stacks and reuses the image coordinates recorded in state.

`make lstk-deploy` performs verification automatically. The verifier checks LocalStack activation, ECR images, ECS and ALB health, API/DB/SQS/JWT behavior, S3 and image proxy access, CloudFront assets and SPA fallback, CORS, Lambda cold starts/event mappings, a harmless IN_APP notification, and disabled New Relic configuration.

After the first full deployment, use the scoped redeploy commands when only one
artifact changed. They preserve the other stacks and existing LocalStack data:

```bash
make lstk-redeploy-services
make lstk-redeploy-frontend
make lstk-redeploy-lambda-order
make lstk-redeploy-lambda-payment
make lstk-redeploy-lambda-notification
make lstk-redeploy-lambdas
```

Services and Lambda redeploys build and push a uniquely tagged image before
applying only that Terraform stack. The frontend redeploy rebuilds the Vite
bundle, applies only the frontend stack, syncs S3, and invalidates CloudFront.
Use `make lstk-verify` afterward when full end-to-end verification is required.

Lower-level granular Terraform commands remain available:

```bash
make lstk-tf-shared-infra LSTK_TF_ACTION=apply
make lstk-tf-services LSTK_TF_ACTION=apply
make lstk-tf-frontend LSTK_TF_ACTION=apply
make lstk-tf-lambdas LSTK_TF_ACTION=apply
```

They fail with an actionable message if shared state or Local ECR repositories are missing.

## Real AWS

Copy `.env.remote.example` to the ignored `.env.remote`, populate the intended account/domain/secrets, authenticate to AWS, and run:

```bash
make aws-plan TF_WORKSPACE=dev
make aws-deploy TF_WORKSPACE=dev
```

The AWS deployer:

- Clears `AWS_ENDPOINT_URL`, service-specific endpoint overrides, LocalStack variables, and `TF_VAR_localstack_*` values.
- Forces `TF_VAR_use_localstack=false`.
- Calls STS against real AWS and refuses account `000000000000`.
- Requires the caller account to match `AWS_ACCOUNT_ID` when it is configured.
- Runs `terraform init -reconfigure` for every stack without automatically upgrading providers.
- Passes secrets through a mode-`600` temporary tfvars JSON file rather than exposing them in process arguments.
- Does not build, push, sync, or invalidate anything in plan mode.

Existing granular `tf-deploy-*` targets use the same guarded deployment script.

## Switching safely

Terraform backend selection happens before normal variables are evaluated, so LocalStack needs both `backend.lstk.tfbackend` and `terraform.lstk.tfvars`. AWS uses the normal S3 backend and real environment values.

Both command families always use `terraform init -reconfigure`. If Terraform ever asks to migrate state while switching targets, stop: AWS and LocalStack state must remain separate.

Provider versions are captured in committed lockfiles for macOS ARM and Linux AMD/ARM. Upgrade them only as an explicit maintenance action with `terraform providers lock`, then validate all six stacks before committing.
