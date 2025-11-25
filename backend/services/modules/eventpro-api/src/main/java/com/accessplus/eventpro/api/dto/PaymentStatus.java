package com.accessplus.eventpro.api.dto;

/**
 * Enum representing the status of a payment.
 * Matches the PaymentStatus enum from README.md "Common Enums" section.
 * 
 * <p>Values:
 * <ul>
 *   <li>PENDING - Payment is pending</li>
 *   <li>SUCCESS - Payment was successful</li>
 *   <li>FAILED - Payment failed</li>
 *   <li>REFUNDED - Payment was refunded</li>
 * </ul>
 */
public enum PaymentStatus {
    PENDING,
    SUCCESS,
    FAILED,
    REFUNDED
}

