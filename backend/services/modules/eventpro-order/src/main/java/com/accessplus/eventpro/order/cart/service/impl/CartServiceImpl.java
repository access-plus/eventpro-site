package com.accessplus.eventpro.order.cart.service.impl;

import com.accessplus.eventpro.shared.exception.ResourceNotFoundException;
import com.accessplus.eventpro.shared.exception.ValidationException;
import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.core.user.repository.UserRepository;
import com.accessplus.eventpro.shared.entity.TicketEntity;
import com.accessplus.eventpro.shared.enums.TicketStatus;
import com.accessplus.eventpro.event.ticket.repository.TicketRepository;
import com.accessplus.eventpro.event.ticket.service.TicketService;
import com.accessplus.eventpro.order.cart.entity.CartEntity;
import com.accessplus.eventpro.order.cart.repository.CartRepository;
import com.accessplus.eventpro.order.cart.service.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Implementation of CartService.
 * Handles cart CRUD operations with ticket availability validation.
 * 
 * <p>Features:
 * <ul>
 *   <li>Add items to cart with ticket availability check</li>
 *   <li>Update cart item quantities</li>
 *   <li>Remove items from cart</li>
 *   <li>Retrieve user's cart</li>
 *   <li>Clear entire cart</li>
 *   <li>Calculate cart total</li>
 *   <li>Ticket status management (AVAILABLE → RESERVED when added, RESERVED → AVAILABLE when removed)</li>
 *   <li>Validation of ticket availability and quantity limits</li>
 *   <li>Proper error handling and logging</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final TicketService ticketService;

    /**
     * Adds a ticket to the user's cart.
     */
    @Override
    public CartEntity addItemToCart(UUID userId, UUID ticketId, Integer quantity) {
        log.debug("Adding item to cart: userId={}, ticketId={}, quantity={}", userId, ticketId, quantity);

        // Validate and fetch user
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        // Validate and fetch ticket
        TicketEntity ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", ticketId.toString()));

        // Validate quantity
        if (quantity == null || quantity <= 0) {
            throw new ValidationException("Quantity must be greater than 0");
        }

        // Validate ticket availability
        if (ticket.getTicketStatus() != TicketStatus.AVAILABLE) {
            throw new IllegalStateException(
                    String.format("Ticket is not available. Current status: %s", ticket.getTicketStatus()));
        }

        // Check if item already exists in cart
        CartEntity existingCartItem = cartRepository.findByUserAndTicket(user, ticket)
                .orElse(null);

        CartEntity cartItem;
        if (existingCartItem != null) {
            int newQuantity = existingCartItem.getQuantity() + quantity;
            existingCartItem.setQuantity(newQuantity);
            cartItem = cartRepository.save(existingCartItem);
            log.info("Updated cart item quantity: cartId={}, newQuantity={}", cartItem.getId(), newQuantity);
        } else {
            cartItem = new CartEntity();
            cartItem.setUser(user);
            cartItem.setTicket(ticket);
            cartItem.setQuantity(quantity);
            cartItem = cartRepository.save(cartItem);
            log.info("Created new cart item: cartId={}, ticketId={}, quantity={}",
                    cartItem.getId(), ticketId, quantity);
        }

        try {
            if (ticket.getTicketStatus() == TicketStatus.AVAILABLE) {
                ticketService.markTicketAsReserved(ticketId);
                log.debug("Marked ticket as reserved: ticketId={}", ticketId);
            }
        } catch (Exception e) {
            log.error("Failed to mark ticket as reserved, rolling back cart row: ticketId={}, error={}",
                    ticketId, e.getMessage(), e);
            cartRepository.delete(cartItem);
            throw new ValidationException("Could not reserve ticket for cart. Please try again.");
        }

        return cartItem;
    }

    /**
     * Updates the quantity of a cart item.
     */
    @Override
    public CartEntity updateCartItemQuantity(UUID userId, UUID ticketId, Integer quantity) {
        log.debug("Updating cart item quantity: userId={}, ticketId={}, quantity={}", userId, ticketId, quantity);

        // Validate quantity
        if (quantity == null || quantity <= 0) {
            throw new ValidationException("Quantity must be greater than 0");
        }

        // Find cart item
        CartEntity cartItem = cartRepository.findByUserIdAndTicketId(userId, ticketId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Cart item", String.format("userId=%s, ticketId=%s", userId, ticketId)));

        // Update quantity
        cartItem.setQuantity(quantity);
        CartEntity updatedCartItem = cartRepository.save(cartItem);
        
        log.info("Updated cart item quantity: cartId={}, newQuantity={}", updatedCartItem.getId(), quantity);
        return updatedCartItem;
    }

    /**
     * Removes an item from the user's cart.
     */
    @Override
    public void removeItemFromCart(UUID userId, UUID ticketId) {
        log.debug("Removing item from cart: userId={}, ticketId={}", userId, ticketId);

        // Find cart item
        CartEntity cartItem = cartRepository.findByUserIdAndTicketId(userId, ticketId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Cart item", String.format("userId=%s, ticketId=%s", userId, ticketId)));

        // Delete cart item
        cartRepository.delete(cartItem);
        log.info("Removed cart item: cartId={}, ticketId={}", cartItem.getId(), ticketId);

        // Mark ticket as AVAILABLE if it was RESERVED
        try {
            TicketEntity ticket = ticketRepository.findById(ticketId)
                    .orElse(null);
            if (ticket != null && ticket.getTicketStatus() == TicketStatus.RESERVED) {
                ticketService.markTicketAsAvailable(ticketId);
                log.debug("Marked ticket as available: ticketId={}", ticketId);
            }
        } catch (Exception e) {
            log.error("Failed to mark ticket as available: ticketId={}, error={}", ticketId, e.getMessage(), e);
            // Continue - ticket status update failure shouldn't prevent cart item removal
        }
    }

    /**
     * Retrieves all cart items for a user.
     */
    @Override
    @Transactional(readOnly = true)
    public List<CartEntity> getUserCart(UUID userId) {
        log.debug("Getting user cart: userId={}", userId);

        // Validate user exists
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", userId.toString());
        }

        List<CartEntity> cartItems = cartRepository.findByUserId(userId);
        log.debug("Found {} items in cart for user: userId={}", cartItems.size(), userId);
        return cartItems;
    }

    /**
     * Clears all items from the user's cart.
     */
    @Override
    public void clearCart(UUID userId) {
        log.debug("Clearing cart: userId={}", userId);

        // Validate user exists
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        // Get all cart items to mark tickets as available
        List<CartEntity> cartItems = cartRepository.findByUser(user);
        
        // Mark all reserved tickets as available
        for (CartEntity cartItem : cartItems) {
            try {
                TicketEntity ticket = cartItem.getTicket();
                if (ticket != null && ticket.getTicketStatus() == TicketStatus.RESERVED) {
                    ticketService.markTicketAsAvailable(ticket.getId());
                    log.debug("Marked ticket as available: ticketId={}", ticket.getId());
                }
            } catch (Exception e) {
                log.error("Failed to mark ticket as available: ticketId={}, error={}", 
                        cartItem.getTicket() != null ? cartItem.getTicket().getId() : "unknown", 
                        e.getMessage(), e);
                // Continue - don't fail entire cart clear if one ticket update fails
            }
        }

        // Delete all cart items
        cartRepository.deleteByUser(user);
        log.info("Cleared cart for user: userId={}, removedItems={}", userId, cartItems.size());
    }

    /**
     * Calculates the total cost of items in the user's cart.
     */
    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateCartTotal(UUID userId) {
        log.debug("Calculating cart total: userId={}", userId);

        // Validate user exists
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", userId.toString());
        }

        List<CartEntity> cartItems = cartRepository.findByUserId(userId);
        BigDecimal total = BigDecimal.ZERO;

        for (CartEntity cartItem : cartItems) {
            if (cartItem.getTicket() != null && cartItem.getTicket().getPrice() != null) {
                BigDecimal itemTotal = cartItem.getTicket().getPrice()
                        .multiply(BigDecimal.valueOf(cartItem.getQuantity()));
                total = total.add(itemTotal);
            }
        }

        log.debug("Cart total for user: userId={}, total={}", userId, total);
        return total;
    }

    /**
     * Gets the total number of items in the user's cart.
     */
    @Override
    @Transactional(readOnly = true)
    public Integer getCartItemCount(UUID userId) {
        log.debug("Getting cart item count: userId={}", userId);

        // Validate user exists
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", userId.toString());
        }

        List<CartEntity> cartItems = cartRepository.findByUserId(userId);
        int totalQuantity = cartItems.stream()
                .mapToInt(CartEntity::getQuantity)
                .sum();

        log.debug("Cart item count for user: userId={}, count={}", userId, totalQuantity);
        return totalQuantity;
    }

    @Override
    @Transactional
    public void removeCartItemsForTicketIds(List<UUID> ticketIds) {
        if (ticketIds == null || ticketIds.isEmpty()) {
            return;
        }
        int deleted = cartRepository.deleteByTicketIdIn(ticketIds);
        if (deleted > 0) {
            log.info("Removed {} cart row(s) whose ticket reservations expired ({} ticket id(s))", deleted, ticketIds.size());
        }
    }

    /** Lines older than this with AVAILABLE tickets are treated as orphans (failed reserve or stale UI). */
    private static final int ORPHAN_CART_MIN_AGE_MINUTES = 5;

    @Override
    public int removeCartLinesForOrphanAvailableTickets() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(ORPHAN_CART_MIN_AGE_MINUTES);
        int deleted = cartRepository.deleteByTicketStatusAndCreatedAtBefore(TicketStatus.AVAILABLE, cutoff);
        if (deleted > 0) {
            log.info("Removed {} stale cart row(s) pointing at AVAILABLE tickets (orphans)", deleted);
        }
        return deleted;
    }
}

