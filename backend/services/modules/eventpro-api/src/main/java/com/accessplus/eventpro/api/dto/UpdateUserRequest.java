package com.accessplus.eventpro.api.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating user profile.
 * 
 * <p>Matches the UserUpdateRequest structure from README.md Users API.
 * All fields are optional - only provided fields will be updated.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    
    @Size(max = 100, message = "First name must not exceed 100 characters")
    private String firstName;
    
    @Size(max = 100, message = "Last name must not exceed 100 characters")
    private String lastName;
    
    // Note: phoneNumber validation can be added if needed
    // @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number format")
    private String phoneNumber;
    
    @Size(max = 1000, message = "Bio must not exceed 1000 characters")
    private String bio;
    
    @Size(max = 255, message = "Location must not exceed 255 characters")
    private String location;
}

