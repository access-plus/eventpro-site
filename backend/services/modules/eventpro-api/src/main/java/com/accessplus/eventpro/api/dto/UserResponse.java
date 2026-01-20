package com.accessplus.eventpro.api.dto;

import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

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
    private String bio;
    private String location;
    private String profilePictureUrl;
    private String status;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Account flags (default to true)
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
                .bio(entity.getBio())
                .location(entity.getLocation())
                .profilePictureUrl(entity.getProfilePictureUrl())
                .status(entity.getStatus())
                .role(entity.getRole())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .enabled(true)
                .build();
    }
}
