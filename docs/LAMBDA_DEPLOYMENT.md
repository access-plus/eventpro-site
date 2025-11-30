# Lambda Functions Deployment Guide

This guide covers building, pushing, and deploying the Lambda functions (payment-processor, notification-sender, order-processor) to AWS.

## Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Docker** installed and running
3. **ECR repository** created (or permissions to create one)
4. **Terraform** initialized in the dev environment

## Build Lambda Images

### Option 1: Using Makefile

```bash
# Build all Lambda images
make lambda-build

# Build specific Lambda
make lambda-build-payment
make lambda-build-notification
make lambda-build-order
```

### Option 2: Using Script Directly

```bash
# Build all Lambda images
./scripts/build-lambda-images.sh all latest

# Build specific Lambda with version
./scripts/build-lambda-images.sh payment-processor v1.0.0

# Build with custom ECR repository
AWS_ACCOUNT_ID=123456789012 AWS_REGION=us-east-1 \
  ./scripts/build-lambda-images.sh payment-processor latest \
  "123456789012.dkr.ecr.us-east-1.amazonaws.com"
```

## Push to ECR

The build script automatically pushes to ECR if AWS credentials are configured. To push manually:

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com

# Push images
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/eventpro-payment-processor:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/eventpro-notification-sender:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/eventpro-order-processor:latest
```

## Deploy with Terraform

### 1. Update Terraform Variables

Edit `infrastructure/environments/dev/terraform.tfvars`:

```hcl
# Lambda Images
order_processor_lambda_image     = "123456789012.dkr.ecr.us-east-1.amazonaws.com/eventpro-order-processor:latest"
payment_processor_lambda_image   = "123456789012.dkr.ecr.us-east-1.amazonaws.com/eventpro-payment-processor:latest"
notification_sender_lambda_image = "123456789012.dkr.ecr.us-east-1.amazonaws.com/eventpro-notification-sender:latest"

# SES Configuration
ses_sender_email = "noreply@eventpro.com"
```

### 2. Apply Terraform

```bash
cd infrastructure/environments/dev
terraform init
terraform plan
terraform apply
```

## Verify Deployment

### Check Lambda Functions

```bash
# List Lambda functions
aws lambda list-functions --query 'Functions[?contains(FunctionName, `eventpro-dev`)].FunctionName'

# Check function status
aws lambda get-function --function-name eventpro-dev-payment-processor
aws lambda get-function --function-name eventpro-dev-notification-sender
aws lambda get-function --function-name eventpro-dev-order-processor
```

### Check SQS Event Source Mappings

```bash
# List event source mappings
aws lambda list-event-source-mappings --function-name eventpro-dev-payment-processor
aws lambda list-event-source-mappings --function-name eventpro-dev-notification-sender
aws lambda list-event-source-mappings --function-name eventpro-dev-order-processor
```

### Check CloudWatch Logs

```bash
# View logs
aws logs tail /aws/lambda/eventpro-dev-payment-processor --follow
aws logs tail /aws/lambda/eventpro-dev-notification-sender --follow
aws logs tail /aws/lambda/eventpro-dev-order-processor --follow
```

## Testing the Flow

### 1. Send Test Message to Order Queue

```bash
# Get queue URL
ORDER_QUEUE_URL=$(aws sqs get-queue-url --queue-name eventpro-dev-order-queue --query 'QueueUrl' --output text)

# Send test message
aws sqs send-message \
  --queue-url "$ORDER_QUEUE_URL" \
  --message-body '{
    "orderId": "550e8400-e29b-41d4-a716-446655440000",
    "orderNumber": "ORD-001",
    "userId": "660e8400-e29b-41d4-a716-446655440000",
    "totalAmount": 100.00,
    "items": [
      {
        "ticketId": "770e8400-e29b-41d4-a716-446655440000",
        "quantity": 2,
        "price": 50.00
      }
    ]
  }'
```

### 2. Monitor Lambda Execution

```bash
# Watch logs in real-time
aws logs tail /aws/lambda/eventpro-dev-order-processor --follow
aws logs tail /aws/lambda/eventpro-dev-payment-processor --follow
aws logs tail /aws/lambda/eventpro-dev-notification-sender --follow
```

### 3. Check Dead Letter Queues

If messages fail processing, they'll be moved to DLQs:

```bash
# Check DLQ for messages
aws sqs get-queue-attributes \
  --queue-url "$ORDER_QUEUE_URL-dlq" \
  --attribute-names ApproximateNumberOfMessages
```

## Troubleshooting

### Lambda Not Receiving Messages

1. **Check Event Source Mapping**: Ensure the mapping is enabled
   ```bash
   aws lambda get-event-source-mapping --uuid <mapping-id>
   ```

2. **Check IAM Permissions**: Lambda needs `sqs:ReceiveMessage` permission
   ```bash
   aws iam get-role-policy \
     --role-name eventpro-dev-payment-processor-lambda-role \
     --policy-name eventpro-dev-payment-processor-sqs-policy
   ```

3. **Check Queue Visibility Timeout**: Should be >= Lambda timeout
   ```bash
   aws sqs get-queue-attributes \
     --queue-url "$PAYMENT_QUEUE_URL" \
     --attribute-names VisibilityTimeout
   ```

### Lambda Execution Errors

1. **Check CloudWatch Logs** for error details
2. **Check Database Connectivity** (if using VPC)
3. **Check Secrets Manager** permissions and secret values
4. **Check Stripe API Key** (for payment-processor)

### Image Pull Errors

1. **Check ECR Repository** exists and is accessible
2. **Check IAM Permissions** for ECR pull
3. **Verify Image URI** in Terraform variables

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy Lambdas

on:
  push:
    branches: [main]
    paths:
      - 'backend/lambdas/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Build and push Lambda images
        run: |
          export AWS_ACCOUNT_ID=${{ secrets.AWS_ACCOUNT_ID }}
          ./scripts/build-lambda-images.sh all ${{ github.sha }}
      
      - name: Deploy with Terraform
        run: |
          cd infrastructure/environments/dev
          terraform init
          terraform apply -auto-approve \
            -var="payment_processor_lambda_image=${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/eventpro-payment-processor:${{ github.sha }}" \
            -var="notification_sender_lambda_image=${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/eventpro-notification-sender:${{ github.sha }}"
```

## Cost Optimization

1. **Memory Allocation**: Start with 512MB, increase if needed
2. **Timeout**: Set appropriate timeouts (payment-processor: 900s, others: 60s)
3. **Reserved Concurrency**: Limit concurrent executions if needed
4. **Provisioned Concurrency**: Only for production critical functions

## Security Best Practices

1. **Secrets**: Use AWS Secrets Manager, never hardcode
2. **VPC**: Place lambdas in private subnets for RDS access
3. **IAM**: Follow least-privilege principle
4. **Encryption**: Enable SQS encryption and KMS for secrets
5. **DLQ**: Always configure dead-letter queues for error handling

