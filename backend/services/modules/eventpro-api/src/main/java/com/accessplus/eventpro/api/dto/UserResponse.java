package com.accessplus.eventpro.api.dto;

import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Response DTO for User entity.
 * 
 * <p>Matches the UserResponse structure from README.md Users API.
 * Note: account flags (accountNonExpired, accountNonLocked, etc.) are not stored
 * in the database as they are managed by Cognito. These can be set to true by default
 * or retrieved from Cognito if needed in the future.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    
    // Account flags (managed by Cognito, default to true)
    @Builder.Default
    private Boolean accountNonExpired = true;
    
    @Builder.Default
    private Boolean accountNonLocked = true;
    
    @Builder.Default
    private Boolean credentialsNonExpired = true;
    
    @Builder.Default
    private Boolean enabled = true;
    
    // Optional nested objects (to be populated in future phases)
    // private List<EventResponse> events;
    // private List<OrderResponse> orders;
    // private Set<RoleDto> roles;
    
    /**
     * Creates a UserResponse from a UserEntity.
     */
    public static UserResponse fromEntity(UserEntity entity) {
        if (entity == null) {
            return null;
        }
        
        return UserResponse.builder()
                .id(entity.getId())
                .firstName(entity.getFirstName())
                .lastName(entity.getLastName())
                .email(entity.getEmail())
                .phoneNumber(entity.getPhoneNumber())
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .enabled(true)
                .build();
    }
}

