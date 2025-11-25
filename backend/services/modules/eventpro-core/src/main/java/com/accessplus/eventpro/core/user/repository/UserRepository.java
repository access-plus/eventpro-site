package com.accessplus.eventpro.core.user.repository;

import com.accessplus.eventpro.core.user.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    Optional<UserEntity> findByCognitoUserId(String cognitoUserId);

    Optional<UserEntity> findByEmail(String email);
}

