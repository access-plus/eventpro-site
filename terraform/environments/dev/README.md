# Dev Environment Terraform Configuration

This directory contains the Terraform configuration for deploying the EventPro platform infrastructure to the AWS dev environment.

## Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Terraform >= 1.12.0** installed
3. **S3 backend bucket exists**: `abc-project-terraform-state`
4. **Route53 hosted zone** already created for your domain
5. **ACM certificates** (recommended for production, optional for dev):
   - CloudFront certificate in `us-east-1` (required for custom domain with HTTPS)
   - ALB certificate in `us-east-1` (required for HTTPS on ALB - currently required by ALB module)
   
   **Note**: The ALB module currently requires a certificate ARN. If you don't have one yet, you can:
   - Request a certificate in ACM (us-east-1) for your domain
   - Or modify the ALB module to make certificate_arn optional

## Setup

1. **Copy the example variables file:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Edit `terraform.tfvars`** with your actual values:
   - Route53 zone name and domain
   - Database credentials (use strong passwords)
   - Stripe API keys (if available)
   - ACM certificate ARNs (if using HTTPS)

3. **Initialize Terraform:**
   ```bash
   terraform init
   ```

4. **Review the plan:**
   ```bash
   terraform plan
   ```

5. **Apply the configuration:**
   ```bash
   terraform apply
   ```

## Important Notes

- **Costs**: This will create real AWS resources that incur costs. Monitor your AWS billing.
- **Database Password**: Use a strong password for the RDS instance. Consider using AWS Secrets Manager to rotate it.
- **Certificates**: If you don't have ACM certificates yet, you can deploy without HTTPS first and add certificates later.
- **S3 Backend**: Ensure the S3 bucket `abc-project-terraform-state` exists and you have access to it.

## Module Dependencies

The configuration uses the following modules (in dependency order):

1. **VPC** - Network infrastructure
2. **RDS** - PostgreSQL database (depends on VPC)
3. **S3** - Storage buckets (images, frontend)
4. **CloudFront** - CDN for frontend (depends on S3)
5. **Cognito** - User authentication
6. **Secrets Manager** - Secure secret storage
7. **ALB** - Load balancer (depends on VPC)
8. **ECS** - Container services (depends on VPC, ALB, RDS)
9. **Route53** - DNS records (depends on CloudFront, ALB)

## Outputs

After deployment, you can view outputs with:
```bash
terraform output
```

Key outputs include:
- VPC ID and subnet IDs
- RDS endpoint (sensitive)
- ALB DNS name
- CloudFront distribution domain
- Cognito User Pool ID and Client ID
- S3 bucket names
- Route53 FQDNs for frontend and APIs

## Troubleshooting

- **Backend errors**: Ensure the S3 bucket exists and your AWS credentials have access
- **Route53 errors**: Verify the hosted zone name matches exactly (including trailing dot)
- **Certificate errors**: ACM certificates must be in `us-east-1` for CloudFront
- **RDS errors**: Ensure the database password meets AWS requirements (8+ characters, mixed case, numbers, symbols)

## Cleanup

To destroy all resources (use with caution):
```bash
terraform destroy
```

**Warning**: This will delete all infrastructure including databases. Ensure you have backups if needed.

