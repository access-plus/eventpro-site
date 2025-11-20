# Terraform Migration: Microservices to Modular Monolith

## Summary

Terraform configuration has been updated from microservices architecture to modular monolith architecture.

## Changes Made

### 1. ECS Services Consolidation

**Before (Microservices)**:
- `ecs_core_api` - Core API service (port 8080)
- `ecs_event_api` - Event API service (port 8081)
- Separate target groups and listener rules

**After (Modular Monolith)**:
- `ecs_eventpro_api` - Single EventPro API service (port 8080)
- Single target group (ALB primary)
- All modules integrated into one service

### 2. Variables Updated

**Removed**:
- `core_api_subdomain` → Replaced with `api_subdomain`
- `event_api_subdomain` → Removed (single API endpoint)
- `core_api_image` → Replaced with `eventpro_api_image`
- `event_api_image` → Removed
- `order_processor_image` → Removed (integrated into monolith)
- `payment_processor_image` → Removed (integrated into monolith)
- `notification_sender_image` → Removed (integrated into monolith)
- `ecs_container_image` → Replaced with `eventpro_api_image`

**Added**:
- `api_subdomain` - Single API subdomain
- `eventpro_api_image` - Docker image for monolith
- `ecs_task_cpu` - CPU units (default: 1024 = 1 vCPU)
- `ecs_task_memory` - Memory in MB (default: 2048 = 2GB)
- `ecs_enable_auto_scaling` - Enable auto-scaling
- `ecs_autoscaling_min_capacity` - Min tasks (default: 2)
- `ecs_autoscaling_max_capacity` - Max tasks (default: 10)
- `ecs_autoscaling_cpu_target_value` - CPU target (default: 70%)
- `ecs_autoscaling_memory_target_value` - Memory target (default: 80%)

**Kept**:
- `analytics_service_image` - Optional (remains as Lambda)

### 3. Route53 Records

**Before**:
- `core-api.example.com` → ALB
- `event-api.example.com` → ALB

**After**:
- `api.example.com` → ALB

### 4. IAM Task Role Policy

**Added comprehensive permissions** for the monolith:
- SQS (SendMessage, ReceiveMessage, DeleteMessage)
- S3 (GetObject, PutObject, DeleteObject) - Images bucket
- SES (SendEmail, SendRawEmail) - Email notifications
- SNS (Publish) - SMS notifications
- Secrets Manager (GetSecretValue) - Database and Stripe secrets

### 5. Environment Variables

**Added**:
- `S3_BUCKET_NAME` - S3 bucket for event images
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

**Kept**:
- Database connection variables
- Cognito variables
- AWS region
- Spring profiles

### 6. Outputs Updated

**Removed**:
- `core_api_fqdn`
- `event_api_fqdn`
- `ecs_core_api_service_name`
- `ecs_event_api_service_name`

**Added**:
- `api_fqdn` - Single API endpoint
- `ecs_service_name` - EventPro API service name
- `ecs_service_arn` - EventPro API service ARN

**Updated**:
- `ecs_cluster_id` - Now references `ecs_eventpro_api`
- `ecs_cluster_name` - Now references `ecs_eventpro_api`

## Configuration Defaults

### ECS Service
- **Desired Count**: 2 tasks (for HA)
- **CPU**: 1024 (1 vCPU per task)
- **Memory**: 2048 MB (2GB per task)
- **Auto-scaling**: Enabled
  - Min: 2 tasks
  - Max: 10 tasks
  - CPU target: 70%
  - Memory target: 80%

### Cost Impact

**Before (Microservices)**:
- 2 ECS services × 1 task each = ~$70/month
- **Total ECS: ~$140/month**

**After (Modular Monolith)**:
- 1 ECS service × 2 tasks = ~$60/month
- **Total ECS: ~$60/month**
- **Savings: ~$80/month (57% reduction)**

## Migration Steps

1. **Update terraform.tfvars**:
   ```hcl
   api_subdomain = "api"
   eventpro_api_image = "eventpro-api:latest"
   ecs_desired_count = 2
   ecs_task_cpu = 1024
   ecs_task_memory = 2048
   ```

2. **Remove old variables** from terraform.tfvars:
   - `core_api_subdomain`
   - `event_api_subdomain`
   - `core_api_image`
   - `event_api_image`
   - `order_processor_image`
   - `payment_processor_image`
   - `notification_sender_image`

3. **Plan and apply**:
   ```bash
   terraform plan
   terraform apply
   ```

4. **Update DNS** (if needed):
   - Point `api.example.com` to ALB
   - Remove old `core-api` and `event-api` records

## Breaking Changes

⚠️ **Important**: This migration will:
- Destroy old ECS services (`core-api`, `event-api`)
- Create new ECS service (`eventpro-api`)
- Update Route53 records
- Change IAM roles and policies

**Recommendation**: Test in a separate environment first, or use Terraform state migration if you need to preserve resources.

## Verification

After applying, verify:
1. ✅ Single ECS service running
2. ✅ API endpoint accessible at `api.example.com`
3. ✅ Health check passing (`/actuator/health`)
4. ✅ Auto-scaling configured
5. ✅ All environment variables set correctly
6. ✅ IAM permissions working (S3, SQS, SES, SNS)

## Next Steps

1. Update CI/CD pipeline to build `eventpro-api` Docker image
2. Push image to ECR
3. Update `eventpro_api_image` variable with ECR image URI
4. Test deployment
5. Monitor auto-scaling behavior

