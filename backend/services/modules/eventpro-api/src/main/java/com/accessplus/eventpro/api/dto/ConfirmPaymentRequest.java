package com.accessplus.eventpro.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmPaymentRequest {

    @NotBlank(message = "Payment intent ID is required")
    private String paymentIntentId;

    /** Buyer state (e.g. CA, NY) for jurisdiction-based sales tax. Optional. */
    private String state;

    /** Buyer country (e.g. US) for tax jurisdiction. Optional. */
    private String country;
}

