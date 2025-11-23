package com.accessplus.eventpro.order.order.repository;

import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.order.order.entity.OrderEntity;
import com.accessplus.eventpro.order.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for OrderEntity.
 * Provides standard CRUD operations and custom query methods.
 * 
 * <p>Custom query methods:
 * <ul>
 *   <li>findByUser - Find all orders for a user</li>
 *   <li>findByStatus - Find all orders with a specific status</li>
 *   <li>findByOrderNumber - Find order by order number</li>
 *   <li>findByUserId - Find all orders for a user by user ID (paginated)</li>
 *   <li>findByStatusAndOrderDateBetween - Find orders by status in date range</li>
 * </ul>
 */
@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {

    /**
     * Finds all orders for a specific user.
     * 
     * @param user the user entity
     * @return list of orders for the user
     */
    List<OrderEntity> findByUser(UserEntity user);

    /**
     * Finds all orders for a specific user with pagination.
     * 
     * @param user the user entity
     * @param pageable pagination parameters
     * @return page of orders for the user
     */
    Page<OrderEntity> findByUser(UserEntity user, Pageable pageable);

    /**
     * Finds all orders for a specific user by user ID with pagination.
     * 
     * @param userId the user UUID
     * @param pageable pagination parameters
     * @return page of orders for the user
     */
    @Query("SELECT o FROM OrderEntity o WHERE o.user.id = :userId")
    Page<OrderEntity> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    /**
     * Finds all orders with a specific status.
     * 
     * @param status the order status
     * @param pageable pagination parameters
     * @return page of orders with the status
     */
    Page<OrderEntity> findByStatus(OrderStatus status, Pageable pageable);

    /**
     * Finds an order by its order number.
     * 
     * @param orderNumber the order number
     * @return optional order if found
     */
    Optional<OrderEntity> findByOrderNumber(String orderNumber);

    /**
     * Finds orders by status within a date range.
     * 
     * @param status the order status
     * @param startDate the start date (inclusive)
     * @param endDate the end date (inclusive)
     * @param pageable pagination parameters
     * @return page of orders matching the criteria
     */
    @Query("SELECT o FROM OrderEntity o WHERE o.status = :status AND o.orderDate BETWEEN :startDate AND :endDate")
    Page<OrderEntity> findByStatusAndOrderDateBetween(
            @Param("status") OrderStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    /**
     * Counts orders by status.
     * 
     * @param status the order status
     * @return count of orders with the status
     */
    long countByStatus(OrderStatus status);

    /**
     * Checks if an order number exists.
     * 
     * @param orderNumber the order number
     * @return true if order number exists
     */
    boolean existsByOrderNumber(String orderNumber);
}

