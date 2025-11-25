package com.accessplus.eventpro.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Response DTO for payment information.
 * 
 * <p>Matches the PaymentResponse structure from README.md Orders API.
 * 
 * <p>Fields:
 * <ul>
 *   <li>id - Payment UUID</li>
 *   <li>amount - Payment amount</li>
 *   <li>paymentMethod - Payment method (e.g., "stripe", "paypal")</li>
 *   <li>status - Payment status enum (PENDING, SUCCESS, FAILED, REFUNDED)</li>
 *   <li>currency - Payment currency (e.g., "USD")</li>
 *   <li>description - Payment description</li>
 * </ul>
 * 
 * <p>Note: PaymentEntity will be created in eventpro-payment module.
 * This DTO is a placeholder for now and will be populated when PaymentEntity is available.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaymentResponse {
    
    private UUID id;
    private BigDecimal amount;
    private String paymentMethod;
    private PaymentStatus status;
    private String currency;
    private String description;
}

