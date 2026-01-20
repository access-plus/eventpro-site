package com.accessplus.eventpro.api.controller;

import com.accessplus.eventpro.api.dto.AddToCartRequest;
import com.accessplus.eventpro.api.dto.ApiResponse;
import com.accessplus.eventpro.api.dto.CartItemRequest;
import com.accessplus.eventpro.api.dto.CartResponse;
import com.accessplus.eventpro.api.dto.UpdateCartRequest;
import com.accessplus.eventpro.shared.exception.ResourceNotFoundException;
import com.accessplus.eventpro.shared.exception.ValidationException;
import com.accessplus.eventpro.core.security.JwtUtils;
import com.accessplus.eventpro.event.event.repository.EventRepository;
import com.accessplus.eventpro.shared.entity.TicketEntity;
import com.accessplus.eventpro.shared.enums.TicketStatus;
import com.accessplus.eventpro.shared.enums.TicketType;
import com.accessplus.eventpro.event.ticket.repository.TicketRepository;
import com.accessplus.eventpro.order.cart.entity.CartEntity;
import com.accessplus.eventpro.order.cart.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for shopping cart operations.
 * 
     * <p>Endpoints:
     * <ul>
     *   <li>POST /api/v1/cart/add - Add item to cart (authenticated users only)</li>
     *   <li>POST /api/v1/cart/items - Add multiple items to cart (batch operation)</li>
     *   <li>GET /api/v1/cart - Get user's cart (authenticated users only)</li>
     *   <li>PATCH /api/v1/cart/update/{ticketId} - Update cart item quantity (authenticated users only)</li>
     *   <li>DELETE /api/v1/cart/delete/{ticketId} - Remove item from cart (authenticated users only)</li>
     *   <li>DELETE /api/v1/cart/clear - Clear cart (authenticated users only)</li>
     * </ul>
 * 
 * <p>All endpoints use authenticated user context from JWT token.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Shopping cart management API")
@SecurityRequirement(name = "bearerAuth")
public class CartController extends BaseController {

    private final CartService cartService;
    private final TicketRepository ticketRepository;
    private final EventRepository eventRepository;

    /**
     * Adds an item to the user's cart.
     * 
     * <p>Supports two ways to specify the ticket:
     * <ul>
     *   <li>Direct ticket UUID: Use {@code id} field</li>
     *   <li>Event + Type: Use {@code eventIdType} + {@code ticketType} to find an available ticket</li>
     * </ul>
     * 
     * @param request AddToCartRequest with ticket information and quantity
     * @return CartResponse with updated cart
     */
    @PostMapping("/add")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'ORGANIZER')")
    @Operation(summary = "Add item to cart", description = "Adds a ticket to the authenticated user's cart. " +
            "Requires USER, ADMIN, or ORGANIZER role. Can specify ticket by UUID or by event ID + ticket type.")
    public ResponseEntity<ApiResponse<CartResponse>> addToCart(
            @Valid @RequestBody AddToCartRequest request) {
        log.debug("Received request to add item to cart: {}", request);

        // Get current user's UUID from JWT
        UUID userId = JwtUtils.getCurrentUserId();

        // Find ticket
        UUID ticketId;
        if (request.getId() != null) {
            // Use direct ticket UUID
            ticketId = request.getId();
        } else if (request.getEventIdType() != null && request.getTicketType() != null) {
            // Find ticket by event ID and ticket type
            try {
                UUID eventId = UUID.fromString(request.getEventIdType());
                ticketId = findAvailableTicketByEventAndType(eventId, request.getTicketType());
            } catch (IllegalArgumentException e) {
                throw new ValidationException("Invalid event ID format: " + request.getEventIdType());
            }
        } else {
            throw new ValidationException("Either 'id' (ticket UUID) or 'eventIdType' + 'ticketType' must be provided");
        }

        // Add to cart
        cartService.addItemToCart(userId, ticketId, request.getQuantity());

        // Get updated cart
        List<CartEntity> cartItems = cartService.getUserCart(userId);
        BigDecimal totalCost = cartService.calculateCartTotal(userId);
        CartResponse response = CartResponse.fromCartEntities(cartItems, userId, totalCost);
        response.setMessage("Item added to cart successfully");

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Item added to cart successfully"));
    }

    /**
     * Adds multiple items to the user's cart in batch.
     * 
     * @param items List of CartItemRequest with ticket information and quantities
     * @return 200 OK
     */
    @PostMapping("/items")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'ORGANIZER')")
    @Operation(summary = "Add items to cart (batch)", description = "Adds multiple tickets to the authenticated user's cart in batch. " +
            "Requires USER, ADMIN, or ORGANIZER role. Each item should specify ticketTypeId (ticket UUID or event UUID) and quantity.")
    public ResponseEntity<ApiResponse<Void>> addItemsToCart(
            @Valid @RequestBody List<CartItemRequest> items) {
        log.debug("Received request to add {} items to cart", items.size());

        // Get current user's UUID from JWT
            UUID userId = JwtUtils.getCurrentUserId();

        // Process each item
        for (CartItemRequest item : items) {
            try {
                // Try to parse as UUID (could be ticket ID or event ID)
                UUID id = UUID.fromString(item.getTicketTypeId());
                
                // Check if it's a valid ticket ID
                if (ticketRepository.existsById(id)) {
                    // It's a ticket ID, add directly
                    cartService.addItemToCart(userId, id, item.getQuantity());
                } else {
                    // Assume it's an event ID - need to find available ticket
                    // For batch operations, we'll use the first available ticket of any type
                    // This is a simplified approach - in production, you might want to specify ticket type
                    throw new ValidationException("Event ID specified but ticket type not provided. " +
                            "For batch operations with event IDs, please use /api/v1/cart/add endpoint.");
                }
            } catch (IllegalArgumentException e) {
                throw new ValidationException("Invalid ticket type ID format: " + item.getTicketTypeId());
            }
        }

        log.info("Successfully added {} items to cart for user: {}", items.size(), userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Items added to cart successfully"));
    }

    /**
     * Retrieves the authenticated user's cart.
     * 
     * @return CartResponse with all cart items
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'ORGANIZER')")
    @Operation(summary = "Get user's cart", description = "Retrieves all items in the authenticated user's cart. " +
            "Requires USER, ADMIN, or ORGANIZER role.")
    public ResponseEntity<ApiResponse<CartResponse>> getCart() {
        log.debug("Received request to get user's cart");

        // Get current user's UUID from JWT
        UUID userId = JwtUtils.getCurrentUserId();

        // Get cart items
        List<CartEntity> cartItems = cartService.getUserCart(userId);
        BigDecimal totalCost = cartService.calculateCartTotal(userId);
        CartResponse response = CartResponse.fromCartEntities(cartItems, userId, totalCost);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Updates the quantity of a cart item.
     * 
     * @param ticketId UUID of the ticket in the cart
     * @param request UpdateCartRequest with new quantity
     * @return CartResponse with updated cart
     */
    @PatchMapping("/update/{ticketId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'ORGANIZER')")
    @Operation(summary = "Update cart item quantity", description = "Updates the quantity of a specific item in the cart. " +
            "Requires USER, ADMIN, or ORGANIZER role.")
    public ResponseEntity<ApiResponse<CartResponse>> updateCartItem(
            @PathVariable UUID ticketId,
            @Valid @RequestBody UpdateCartRequest request) {
        log.debug("Received request to update cart item: ticketId={}, quantity={}", ticketId, request.getQuantity());

        // Get current user's UUID from JWT
        UUID userId = JwtUtils.getCurrentUserId();

        // Update cart item
        cartService.updateCartItemQuantity(userId, ticketId, request.getQuantity());

        // Get updated cart
        List<CartEntity> cartItems = cartService.getUserCart(userId);
        BigDecimal totalCost = cartService.calculateCartTotal(userId);
        CartResponse response = CartResponse.fromCartEntities(cartItems, userId, totalCost);
        response.setMessage("Cart item updated successfully");

        return ResponseEntity.ok(ApiResponse.success(response, "Cart item updated successfully"));
    }

    /**
     * Removes an item from the user's cart.
     * 
     * @param ticketId UUID of the ticket to remove
     * @return 200 OK with success message
     */
    @DeleteMapping("/delete/{ticketId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'ORGANIZER')")
    @Operation(summary = "Remove item from cart", description = "Removes a specific item from the authenticated user's cart. " +
            "Requires USER, ADMIN, or ORGANIZER role.")
    public ResponseEntity<ApiResponse<Void>> removeFromCart(@PathVariable UUID ticketId) {
        log.debug("Received request to remove item from cart: ticketId={}", ticketId);

        // Get current user's UUID from JWT
        UUID userId = JwtUtils.getCurrentUserId();

        // Remove from cart
        cartService.removeItemFromCart(userId, ticketId);

        return ResponseEntity.ok(ApiResponse.success(null, "Item removed from cart successfully"));
    }

    /**
     * Clears all items from the user's cart.
     * 
     * @return 200 OK with success message
     */
    @DeleteMapping("/clear")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'ORGANIZER')")
    @Operation(summary = "Clear cart", description = "Removes all items from the authenticated user's cart. " +
            "Requires USER, ADMIN, or ORGANIZER role.")
    public ResponseEntity<ApiResponse<Void>> clearCart() {
        log.debug("Received request to clear cart");

        // Get current user's UUID from JWT
        UUID userId = JwtUtils.getCurrentUserId();

        // Clear cart
        cartService.clearCart(userId);

        return ResponseEntity.ok(ApiResponse.success(null, "Cart cleared successfully"));
    }

    /**
     * Finds an available ticket by event ID and ticket type.
     * 
     * @param eventId event UUID
     * @param ticketType ticket type
     * @return ticket UUID
     * @throws ResourceNotFoundException if no available ticket found
     */
    private UUID findAvailableTicketByEventAndType(UUID eventId, TicketType ticketType) {
        // Validate event exists
        if (!eventRepository.existsById(eventId)) {
            throw new ResourceNotFoundException("Event", eventId.toString());
        }

        // Find available tickets of the specified type
        List<TicketEntity> availableTickets = ticketRepository
                .findByEventIdAndTicketType(eventId, ticketType, PageRequest.of(0, 1))
                .getContent()
                .stream()
                .filter(t -> t.getTicketStatus() == TicketStatus.AVAILABLE)
                .toList();

        if (availableTickets.isEmpty()) {
            throw new ResourceNotFoundException(
                    "Available ticket", String.format("eventId=%s, ticketType=%s", eventId, ticketType));
        }

        return availableTickets.get(0).getId();
    }
}
