package com.accessplus.eventpro.core.user.service;

import com.accessplus.eventpro.core.user.entity.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface UserService {

    UserEntity createUser(String email, String passwordHash, String firstName,
                          String lastName, String phoneNumber, String role);

    UserEntity getUserByEmail(String email);

    UserEntity getUserById(UUID userId);

    Page<UserEntity> getAllUsers(Pageable pageable);

    UserEntity updateUserProfile(UUID userId, String firstName, String lastName, String phoneNumber);

    UserEntity updateUserProfile(UUID userId, String firstName, String lastName, String phoneNumber,
                                 String bio, String location, String profilePictureUrl);

    UserEntity updateUserProfile(UUID userId, String firstName, String lastName, String phoneNumber,
                                 String bio, String location, String profilePictureUrl, String culturalNiche);

    UserEntity updateUserStatus(UUID userId, String status);

    UserEntity updateUserRole(UUID userId, String role);
}
