# SQS Message Contracts

**Date**: 2025-01-15  
**Phase**: 1 - Design & Contracts

## Overview

EventPro platform uses AWS SQS for asynchronous message processing between services. All messages are JSON format and follow a consistent structure.

## Queue Configuration

### Order Queue
- **Name**: `{environment}-order-queue`
- **Visibility Timeout**: 5 minutes
- **Message Retention**: 14 days
- **Batch Size**: 10 messages
- **Dead Letter Queue**: Yes
- **Purpose**: Receives orders from Core API for processing

### Payment Queue
- **Name**: `{environment}-payment-queue`
- **Visibility Timeout**: 15 minutes
- **Message Retention**: 14 days
- **Batch Size**: 1 message (payment processing is critical)
- **Dead Letter Queue**: Yes
- **Purpose**: Receives validated orders for payment processing

### Notification Queue
- **Name**: `{environment}-notification-queue`
- **Visibility Timeout**: 60 seconds
- **Message Retention**: 7 days
- **Batch Size**: 10 messages
- **Dead Letter Queue**: Yes
- **Purpose**: Receives notifications to send (email, SMS, in-app)

## Message Format

All SQS messages follow this base structure:

```json
{
  "messageId": "uuid",
  "messageType": "string",
  "timestamp": "ISO-8601 datetime",
  "source": "string",
  "payload": {}
}
```

## Message Types

### 1. Order Message

**Queue**: `order-queue`  
**Publisher**: Core API (OrderService)  
**Consumer**: Order Processor Lambda

**Message Structure**:
```json
{
  "messageId": "550e8400-e29b-41d4-a716-446655440000",
  "messageType": "ORDER_CREATED",
  "timestamp": "2025-01-15T10:30:00Z",
  "source": "core-api",
  "payload": {
    "orderId": "550e8400-e29b-41d4-a716-446655440001",
    "orderNumber": "ORD-2025-001234",
    "userId": "550e8400-e29b-41d4-a716-446655440002",
    "totalAmount": 150.00,
    "orderItems": [
      {
        "ticketId": "550e8400-e29b-41d4-a716-446655440003",
        "quantity": 2,
        "price": 75.00,
        "ticketType": "VIP"
      }
    ],
    "orderDate": "2025-01-15T10:30:00Z"
  }
}
```

**Processing Flow**:
1. Order Processor Lambda receives message
2. Validates order (checks ticket availability)
3. Reserves tickets (updates ticket status to RESERVED)
4. Updates order status to PENDING
5. Publishes to `payment-queue` if validation successful
6. Publishes error message to DLQ if validation fails

**Error Handling**:
- If ticket unavailable: Message sent to DLQ, order status set to CANCELLED
- If validation fails: Message sent to DLQ, order status set to CANCELLED
- Retry logic: 3 attempts with exponential backoff

### 2. Payment Message

**Queue**: `payment-queue`  
**Publisher**: Order Processor Lambda  
**Consumer**: Payment Processor Lambda

**Message Structure**:
```json
{
  "messageId": "550e8400-e29b-41d4-a716-446655440010",
  "messageType": "PAYMENT_REQUIRED",
  "timestamp": "2025-01-15T10:31:00Z",
  "source": "order-processor",
  "payload": {
    "orderId": "550e8400-e29b-41d4-a716-446655440001",
    "orderNumber": "ORD-2025-001234",
    "userId": "550e8400-e29b-41d4-a716-446655440002",
    "totalAmount": 150.00,
    "paymentMethod": "stripe",
    "paymentIntentId": "pi_1234567890",
    "reservedTicketIds": [
      "550e8400-e29b-41d4-a716-446655440003",
      "550e8400-e29b-41d4-a716-446655440004"
    ]
  }
}
```

**Processing Flow**:
1. Payment Processor Lambda receives message
2. Processes payment via Stripe API
3. If payment successful:
   - Updates payment status to SUCCESS
   - Updates order status to PAID
   - Assigns tickets to user (updates ticket purchaser and status to SOLD)
   - Generates QR codes for tickets
   - Publishes to `notification-queue`
4. If payment failed:
   - Updates payment status to FAILED
   - Updates order status to CANCELLED
   - Releases reserved tickets (status back to AVAILABLE)
   - Publishes failure notification to `notification-queue`

**Error Handling**:
- Stripe API errors: Retry 3 times, then send to DLQ
- Database errors: Send to DLQ immediately
- Payment timeout: Send to DLQ, release tickets

### 3. Notification Message

**Queue**: `notification-queue`  
**Publisher**: Payment Processor Lambda, Core API  
**Consumer**: Notification Sender Lambda

**Message Structure**:
```json
{
  "messageId": "550e8400-e29b-41d4-a716-446655440020",
  "messageType": "ORDER_CONFIRMATION",
  "timestamp": "2025-01-15T10:32:00Z",
  "source": "payment-processor",
  "payload": {
    "userId": "550e8400-e29b-41d4-a716-446655440002",
    "orderId": "550e8400-e29b-41d4-a716-446655440001",
    "orderNumber": "ORD-2025-001234",
    "deliveryTypes": ["EMAIL", "SMS", "IN_APP"],
    "email": "user@example.com",
    "phoneNumber": "+1234567890",
    "templateData": {
      "orderNumber": "ORD-2025-001234",
      "totalAmount": 150.00,
      "eventName": "Summer Music Festival",
      "eventDate": "2025-07-15T18:00:00Z",
      "ticketCount": 2,
      "ticketTypes": ["VIP", "VIP"]
    }
  }
}
```

**Message Types**:
- `ORDER_CONFIRMATION`: Order successfully paid
- `PAYMENT_SUCCESS`: Payment processed successfully
- `PAYMENT_FAILED`: Payment failed
- `EVENT_REMINDER`: Event reminder (24 hours before)
- `TICKET_READY`: Tickets ready for download
- `SYSTEM_ANNOUNCEMENT`: System-wide announcements

**Processing Flow**:
1. Notification Sender Lambda receives message
2. Checks user notification preferences
3. Sends via requested delivery types:
   - **EMAIL**: AWS SES
   - **SMS**: AWS SNS
   - **IN_APP**: WebSocket (if user connected) + Database
4. Updates notification status in database
5. Logs delivery status

**Error Handling**:
- SES/SNS errors: Retry 3 times, then send to DLQ
- WebSocket errors: Log and continue (non-critical)
- Database errors: Send to DLQ

## Message Attributes

All messages include standard SQS message attributes:

- `MessageGroupId`: Not used (standard queue, not FIFO)
- `MessageDeduplicationId`: Not used (standard queue)
- `ApproximateReceiveCount`: Used for retry logic
- Custom attributes:
  - `source-service`: Service that published message
  - `correlation-id`: For tracing across services

## Error Messages

When processing fails, error messages are sent to Dead Letter Queues:

**Error Message Structure**:
```json
{
  "originalMessage": {},
  "error": {
    "code": "TICKET_UNAVAILABLE",
    "message": "Ticket no longer available",
    "timestamp": "2025-01-15T10:30:05Z"
  },
  "retryCount": 3,
  "failedAt": "2025-01-15T10:30:05Z"
}
```

## Message Ordering

**Note**: Standard SQS queues do not guarantee message ordering. For this platform:
- Order messages: Ordering not critical (each order processed independently)
- Payment messages: Ordering not critical (each payment processed independently)
- Notification messages: Ordering not critical (each notification independent)

If ordering becomes critical, consider FIFO queues (additional cost and complexity).

## Idempotency

All message processors MUST be idempotent:
- Order Processor: Check if order already processed before processing
- Payment Processor: Check payment status before processing
- Notification Sender: Check if notification already sent

**Idempotency Keys**:
- Order messages: `orderId`
- Payment messages: `orderId` + `paymentIntentId`
- Notification messages: `messageId` (unique per notification)

## Monitoring

**CloudWatch Metrics**:
- `ApproximateNumberOfMessages`: Queue depth
- `ApproximateNumberOfMessagesNotVisible`: Messages being processed
- `NumberOfMessagesSent`: Messages published
- `NumberOfMessagesReceived`: Messages consumed
- `NumberOfMessagesDeleted`: Messages successfully processed

**Alarms**:
- Queue depth > 1000: Alert team
- DLQ messages > 10: Alert team immediately
- Processing time > visibility timeout: Alert team

