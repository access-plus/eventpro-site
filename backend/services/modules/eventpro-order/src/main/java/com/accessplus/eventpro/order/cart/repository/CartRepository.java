package com.accessplus.eventpro.order.cart.repository;

import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.shared.entity.TicketEntity;
import com.accessplus.eventpro.order.cart.entity.CartEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for CartEntity.
 * Provides standard CRUD operations and custom query methods.
 * 
 * <p>Custom query methods:
 * <ul>
 *   <li>findByUser - Find all cart items for a user</li>
 *   <li>findByUserAndTicket - Find a specific cart item by user and ticket</li>
 *   <li>findByUserId - Find all cart items for a user by user ID</li>
 *   <li>deleteByUser - Delete all cart items for a user</li>
 * </ul>
 */
@Repository
public interface CartRepository extends JpaRepository<CartEntity, UUID> {

    /**
     * Finds all cart items for a specific user.
     * 
     * @param user the user entity
     * @return list of cart items for the user
     */
    List<CartEntity> findByUser(UserEntity user);

    /**
     * Finds all cart items for a specific user by user ID.
     * 
     * @param userId the user UUID
     * @return list of cart items for the user
     */
    @Query("SELECT c FROM CartEntity c WHERE c.user.id = :userId")
    List<CartEntity> findByUserId(@Param("userId") UUID userId);

    /**
     * Finds a cart item by user and ticket.
     * Used to check if a ticket is already in the user's cart.
     * 
     * @param user the user entity
     * @param ticket the ticket entity
     * @return optional cart item if found
     */
    Optional<CartEntity> findByUserAndTicket(UserEntity user, TicketEntity ticket);

    /**
     * Finds a cart item by user ID and ticket ID.
     * 
     * @param userId the user UUID
     * @param ticketId the ticket UUID
     * @return optional cart item if found
     */
    @Query("SELECT c FROM CartEntity c WHERE c.user.id = :userId AND c.ticket.id = :ticketId")
    Optional<CartEntity> findByUserIdAndTicketId(@Param("userId") UUID userId, @Param("ticketId") UUID ticketId);

    /**
     * Deletes all cart items for a specific user.
     * Used when clearing the cart.
     * 
     * @param user the user entity
     */
    void deleteByUser(UserEntity user);

    /**
     * Deletes all cart items for a specific user by user ID.
     * 
     * @param userId the user UUID
     */
    @Query("DELETE FROM CartEntity c WHERE c.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);

    /**
     * Counts the number of cart items for a specific user.
     * 
     * @param userId the user UUID
     * @return count of cart items
     */
    @Query("SELECT COUNT(c) FROM CartEntity c WHERE c.user.id = :userId")
    long countByUserId(@Param("userId") UUID userId);
}

