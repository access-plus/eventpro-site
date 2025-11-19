# Terraform - Dev Environment

## Overview

This directory contains the Terraform configuration for the **EventPro Platform Dev Environment** using a **Modular Monolith Architecture**.

## Architecture

- **Single ECS Service**: `eventpro-api` (modular monolith)
- **Auto-scaling**: 2-10 tasks based on CPU/Memory
- **Database**: PostgreSQL RDS (Multi-AZ optional)
- **Load Balancer**: ALB with single target group
- **Frontend**: S3 + CloudFront CDN
- **Authentication**: AWS Cognito

## Quick Start

1. **Copy example variables**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Edit `terraform.tfvars`** with your values:
   - Route53 zone name
   - Domain name
   - Database credentials
   - Stripe keys
   - Docker image name

3. **Initialize Terraform**:
   ```bash
   terraform init
   ```

4. **Plan**:
   ```bash
   terraform plan
   ```

5. **Apply**:
   ```bash
   terraform apply
   ```

## Key Variables

### Required
- `route53_zone_name` - Your Route53 hosted zone
- `domain_name` - Your domain name
- `eventpro_api_image` - Docker image for the API

### Optional
- `ecs_desired_count` - Number of tasks (default: 2)
- `ecs_task_cpu` - CPU units (default: 1024 = 1 vCPU)
- `ecs_task_memory` - Memory in MB (default: 2048 = 2GB)
- `ecs_enable_auto_scaling` - Enable auto-scaling (default: true)

## Outputs

After applying, you'll get:
- `api_fqdn` - API endpoint URL
- `frontend_fqdn` - Frontend URL
- `ecs_cluster_name` - ECS cluster name
- `ecs_service_name` - ECS service name
- Database and Cognito details

## Cost Estimate (Dev)

- ECS Fargate (2 tasks, 1 vCPU, 2GB each): ~$60/month
- ALB: ~$20/month
- RDS (db.t3.medium): ~$60/month
- S3 + CloudFront: ~$5/month
- **Total: ~$145/month**

## Migration Notes

This configuration has been updated from microservices to modular monolith:
- ✅ Single ECS service instead of multiple
- ✅ Single API endpoint instead of separate endpoints
- ✅ Removed Lambda function variables (integrated into monolith)
- ✅ Added auto-scaling configuration
- ✅ Updated IAM policies for all AWS services

## Next Steps

1. Update CI/CD to build and push `eventpro-api` Docker image
2. Configure ECR repository for the image
3. Update environment variables as needed
4. Test deployment
