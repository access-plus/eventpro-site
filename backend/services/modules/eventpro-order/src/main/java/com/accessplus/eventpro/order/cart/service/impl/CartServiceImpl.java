package com.accessplus.eventpro.order.cart.service.impl;

import com.accessplus.eventpro.shared.exception.ResourceNotFoundException;
import com.accessplus.eventpro.shared.exception.ValidationException;
import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.core.user.repository.UserRepository;
import com.accessplus.eventpro.shared.entity.TicketEntity;
import com.accessplus.eventpro.shared.enums.TicketStatus;
import com.accessplus.eventpro.shared.enums.TicketType;
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
     * Adds one concrete ticket to the user's cart. Direct ticket IDs represent physical
     * tickets/seats, so quantity must be exactly one.
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
        if (quantity != 1) {
            throw new ValidationException("Direct ticket additions must have quantity 1");
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
            existingCartItem.setQuantity(1);
            cartItem = cartRepository.save(existingCartItem);
            log.info("Cart item already existed, normalized quantity: cartId={}", cartItem.getId());
        } else {
            cartItem = new CartEntity();
            cartItem.setUser(user);
            cartItem.setTicket(ticket);
            cartItem.setQuantity(1);
            cartItem = cartRepository.save(cartItem);
            log.info("Created new cart item: cartId={}, ticketId={}", cartItem.getId(), ticketId);
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

    @Override
    public List<CartEntity> addTicketTypeToCart(UUID userId, UUID eventId, TicketType ticketType, Integer quantity) {
        log.debug("Adding ticket type to cart: userId={}, eventId={}, ticketType={}, quantity={}",
                userId, eventId, ticketType, quantity);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));
        if (eventId == null) {
            throw new ValidationException("Event ID is required");
        }
        if (ticketType == null) {
            throw new ValidationException("Ticket type is required");
        }
        if (quantity == null || quantity <= 0) {
            throw new ValidationException("Quantity must be greater than 0");
        }

        List<UUID> reservedTicketIds = ticketService.findAndReserveAvailableTickets(eventId, ticketType, quantity);
        if (reservedTicketIds.size() < quantity) {
            for (UUID reservedTicketId : reservedTicketIds) {
                try {
                    ticketService.markTicketAsAvailable(reservedTicketId);
                } catch (Exception e) {
                    log.warn("Failed to release partially reserved ticket {} after insufficient inventory",
                            reservedTicketId, e);
                }
            }
            throw new ValidationException(String.format(
                    "Only %d ticket(s) are available for %s", reservedTicketIds.size(), ticketType));
        }

        List<CartEntity> savedRows = new java.util.ArrayList<>();
        try {
            for (UUID reservedTicketId : reservedTicketIds) {
                TicketEntity reservedTicket = ticketRepository.findById(reservedTicketId)
                        .orElseThrow(() -> new ResourceNotFoundException("Ticket", reservedTicketId.toString()));

                CartEntity cartItem = new CartEntity();
                cartItem.setUser(user);
                cartItem.setTicket(reservedTicket);
                cartItem.setQuantity(1);
                savedRows.add(cartRepository.save(cartItem));
            }
        } catch (RuntimeException e) {
            for (UUID reservedTicketId : reservedTicketIds) {
                try {
                    ticketService.markTicketAsAvailable(reservedTicketId);
                } catch (Exception releaseError) {
                    log.warn("Failed to release ticket {} after cart row creation failure",
                            reservedTicketId, releaseError);
                }
            }
            throw e;
        }

        log.info("Added {} {} ticket(s) to cart for user={}, eventId={}",
                savedRows.size(), ticketType, userId, eventId);
        return savedRows;
    }

    @Override
    public List<CartEntity> setTicketTypeCartQuantity(UUID userId, UUID eventId, TicketType ticketType, Integer quantity) {
        if (quantity == null || quantity < 0) {
            throw new ValidationException("Quantity must be 0 or greater");
        }
        List<CartEntity> currentRows = cartRepository.findGeneralAdmissionLine(userId, eventId, ticketType);
        int currentQuantity = currentRows.size();
        if (quantity == currentQuantity) {
            normalizeCartRows(currentRows);
            return currentRows;
        }
        if (quantity > currentQuantity) {
            addTicketTypeToCart(userId, eventId, ticketType, quantity - currentQuantity);
        } else {
            releaseCartRows(currentRows.subList(quantity, currentRows.size()));
        }
        return cartRepository.findGeneralAdmissionLine(userId, eventId, ticketType);
    }

    @Override
    public int removeTicketTypeFromCart(UUID userId, UUID eventId, TicketType ticketType) {
        List<CartEntity> currentRows = cartRepository.findGeneralAdmissionLine(userId, eventId, ticketType);
        releaseCartRows(currentRows);
        return currentRows.size();
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

        if (quantity != 1) {
            throw new ValidationException("Direct cart item quantity must be 1");
        }

        // Direct cart rows represent one concrete ticket.
        cartItem.setQuantity(1);
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
            throw new ValidationException("Could not release ticket from cart. Please try again.");
        }

        // Delete cart item only after the reserved ticket was released.
        cartRepository.delete(cartItem);
        log.info("Removed cart item: cartId={}, ticketId={}", cartItem.getId(), ticketId);
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
        BigDecimal total = cartItems.stream()
                .filter(cartItem -> cartItem.getTicket() != null && cartItem.getTicket().getPrice() != null)
                .map(cartItem -> cartItem.getTicket().getPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

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
        int totalQuantity = cartItems.size();

        log.debug("Cart item count for user: userId={}, count={}", userId, totalQuantity);
        return totalQuantity;
    }

    @Override
    @Transactional
    public int releaseExpiredCartReservations(UUID userId) {
        List<CartEntity> expiredItems = cartRepository.findByUserIdAndExpiredReservation(
                userId, TicketStatus.RESERVED, LocalDateTime.now());
        if (expiredItems == null || expiredItems.isEmpty()) {
            return 0;
        }

        int released = 0;
        for (CartEntity cartItem : expiredItems) {
            TicketEntity ticket = cartItem.getTicket();
            if (ticket == null || ticket.getId() == null) {
                continue;
            }
            try {
                ticketService.markTicketAsAvailable(ticket.getId());
                cartRepository.delete(cartItem);
                released++;
            } catch (Exception e) {
                log.warn("Failed to release expired cart reservation: cartId={}, ticketId={}",
                        cartItem.getId(), ticket.getId(), e);
            }
        }
        if (released > 0) {
            log.info("Released {} expired cart reservation(s) for user {}", released, userId);
        }
        return released;
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

    private void normalizeCartRows(List<CartEntity> cartRows) {
        for (CartEntity cartRow : cartRows) {
            if (cartRow.getQuantity() == null || cartRow.getQuantity() != 1) {
                cartRow.setQuantity(1);
                cartRepository.save(cartRow);
            }
        }
    }

    private void releaseCartRows(List<CartEntity> cartRows) {
        for (CartEntity cartRow : cartRows) {
            TicketEntity ticket = cartRow.getTicket();
            if (ticket != null && ticket.getId() != null && ticket.getTicketStatus() == TicketStatus.RESERVED) {
                try {
                    ticketService.markTicketAsAvailable(ticket.getId());
                } catch (Exception e) {
                    log.error("Failed to mark ticket as available: ticketId={}, error={}",
                            ticket.getId(), e.getMessage(), e);
                    throw new ValidationException("Could not release ticket from cart. Please try again.");
                }
            }
            cartRepository.delete(cartRow);
        }
    }
}
