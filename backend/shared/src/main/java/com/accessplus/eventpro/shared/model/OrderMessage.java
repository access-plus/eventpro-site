package com.accessplus.eventpro.shared.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderMessage {
    
    @JsonProperty("orderId")
    private UUID orderId;
    
    @JsonProperty("orderNumber")
    private String orderNumber;
    
    @JsonProperty("userId")
    private UUID userId;
    
    @JsonProperty("totalAmount")
    private java.math.BigDecimal totalAmount;

   


    public java.math.BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(java.math.BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
}

