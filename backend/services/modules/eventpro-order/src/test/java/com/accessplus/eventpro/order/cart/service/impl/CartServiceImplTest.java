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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CartServiceImpl.
 * Tests cart operations including add, update, remove, clear, and calculation methods.
 */
@ExtendWith(MockitoExtension.class)
class CartServiceImplTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TicketService ticketService;

    @InjectMocks
    private CartServiceImpl cartService;

    private UUID userId;
    private UUID ticketId;
    private UserEntity user;
    private TicketEntity ticket;
    private CartEntity cartItem;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        ticketId = UUID.randomUUID();

        user = new UserEntity();
        user.setId(userId);
        user.setEmail("test@example.com");
        user.setFirstName("Test");
        user.setLastName("User");

        ticket = new TicketEntity();
        ticket.setId(ticketId);
        ticket.setName("Test Ticket");
        ticket.setPrice(new BigDecimal("50.00"));
        ticket.setEventId(UUID.randomUUID());
        ticket.setTicketType(TicketType.REGULAR);
        ticket.setTicketStatus(TicketStatus.AVAILABLE);

        cartItem = new CartEntity();
        cartItem.setId(UUID.randomUUID());
        cartItem.setUser(user);
        cartItem.setTicket(ticket);
        cartItem.setQuantity(1);
    }

    // ========== addItemToCart Tests ==========

    @Test
    void testAddItemToCart_Success_NewItem() {
        // Given
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));
        when(cartRepository.findByUserAndTicket(user, ticket)).thenReturn(Optional.empty());
        when(cartRepository.save(any(CartEntity.class))).thenReturn(cartItem);
        doNothing().when(ticketService).markTicketAsReserved(ticketId);

        // When
        CartEntity result = cartService.addItemToCart(userId, ticketId, 1);

        // Then
        assertNotNull(result);
        assertEquals(cartItem.getId(), result.getId());
        verify(userRepository).findById(userId);
        verify(ticketRepository).findById(ticketId);
        verify(cartRepository).findByUserAndTicket(user, ticket);
        verify(cartRepository).save(any(CartEntity.class));
        verify(ticketService).markTicketAsReserved(ticketId);
    }

    @Test
    void testAddItemToCart_Success_UpdateExistingItem() {
        // Given
        CartEntity existingCartItem = new CartEntity();
        existingCartItem.setId(UUID.randomUUID());
        existingCartItem.setUser(user);
        existingCartItem.setTicket(ticket);
        existingCartItem.setQuantity(1);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));
        when(cartRepository.findByUserAndTicket(user, ticket)).thenReturn(Optional.of(existingCartItem));
        when(cartRepository.save(existingCartItem)).thenReturn(existingCartItem);
        doNothing().when(ticketService).markTicketAsReserved(ticketId);

        // When
        CartEntity result = cartService.addItemToCart(userId, ticketId, 1);

        // Then
        assertNotNull(result);
        assertEquals(1, existingCartItem.getQuantity());
        verify(cartRepository).save(existingCartItem);
        verify(ticketService).markTicketAsReserved(ticketId);
    }

    @Test
    void testAddItemToCart_UserNotFound() {
        // Given
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // When/Then
        assertThrows(ResourceNotFoundException.class, () -> 
                cartService.addItemToCart(userId, ticketId, 1));
        verify(userRepository).findById(userId);
        verify(ticketRepository, never()).findById(any());
        verify(cartRepository, never()).save(any());
    }

    @Test
    void testAddItemToCart_TicketNotFound() {
        // Given
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.empty());

        // When/Then
        assertThrows(ResourceNotFoundException.class, () -> 
                cartService.addItemToCart(userId, ticketId, 1));
        verify(userRepository).findById(userId);
        verify(ticketRepository).findById(ticketId);
        verify(cartRepository, never()).save(any());
    }

    @Test
    void testAddItemToCart_InvalidQuantity_Null() {
        // Given
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));

        // When/Then
        assertThrows(ValidationException.class, () -> 
                cartService.addItemToCart(userId, ticketId, null));
        verify(cartRepository, never()).save(any());
    }

    @Test
    void testAddItemToCart_InvalidQuantity_Zero() {
        // Given
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));

        // When/Then
        assertThrows(ValidationException.class, () -> 
                cartService.addItemToCart(userId, ticketId, 0));
        verify(cartRepository, never()).save(any());
    }

    @Test
    void testAddItemToCart_InvalidQuantity_Negative() {
        // Given
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));

        // When/Then
        assertThrows(ValidationException.class, () -> 
                cartService.addItemToCart(userId, ticketId, -1));
        verify(cartRepository, never()).save(any());
    }

    @Test
    void testAddItemToCart_TicketNotAvailable() {
        // Given
        ticket.setTicketStatus(TicketStatus.SOLD);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));

        // When/Then
        assertThrows(IllegalStateException.class, () -> 
                cartService.addItemToCart(userId, ticketId, 1));
        verify(cartRepository, never()).save(any());
        verify(ticketService, never()).markTicketAsReserved(any());
    }

    @Test
    void testAddItemToCart_TicketAlreadyReserved() {
        // Given
        ticket.setTicketStatus(TicketStatus.RESERVED);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));

        // When/Then
        assertThrows(IllegalStateException.class, () -> 
                cartService.addItemToCart(userId, ticketId, 1));
        verify(cartRepository, never()).findByUserAndTicket(any(), any());
        verify(cartRepository, never()).save(any());
    }

    @Test
    void testAddTicketTypeToCart_ReservesExactQuantityAndCreatesOneRowPerTicket() {
        // Given
        UUID eventId = ticket.getEventId();
        UUID ticketId2 = UUID.randomUUID();
        TicketEntity ticket2 = new TicketEntity();
        ticket2.setId(ticketId2);
        ticket2.setName("Test Ticket");
        ticket2.setPrice(new BigDecimal("50.00"));
        ticket2.setEventId(eventId);
        ticket2.setTicketType(TicketType.REGULAR);
        ticket2.setTicketStatus(TicketStatus.RESERVED);

        ticket.setTicketStatus(TicketStatus.RESERVED);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(ticketService.findAndReserveAvailableTickets(eventId, TicketType.REGULAR, 2))
                .thenReturn(List.of(ticketId, ticketId2));
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));
        when(ticketRepository.findById(ticketId2)).thenReturn(Optional.of(ticket2));
        when(cartRepository.save(any(CartEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        List<CartEntity> result = cartService.addTicketTypeToCart(userId, eventId, TicketType.REGULAR, 2);

        // Then
        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(row -> row.getQuantity() == 1));
        verify(ticketService).findAndReserveAvailableTickets(eventId, TicketType.REGULAR, 2);
        verify(cartRepository, times(2)).save(any(CartEntity.class));
    }

    @Test
    void testAddTicketTypeToCart_RollsBackPartialReserveWhenInventoryInsufficient() {
        // Given
        UUID eventId = ticket.getEventId();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(ticketService.findAndReserveAvailableTickets(eventId, TicketType.REGULAR, 3))
                .thenReturn(List.of(ticketId));
        doNothing().when(ticketService).markTicketAsAvailable(ticketId);

        // When/Then
        assertThrows(ValidationException.class, () ->
                cartService.addTicketTypeToCart(userId, eventId, TicketType.REGULAR, 3));
        verify(ticketService).markTicketAsAvailable(ticketId);
        verify(cartRepository, never()).save(any());
    }

    // ========== updateCartItemQuantity Tests ==========

    @Test
    void testUpdateCartItemQuantity_Success() {
        // Given
        when(cartRepository.findByUserIdAndTicketId(userId, ticketId))
                .thenReturn(Optional.of(cartItem));
        when(cartRepository.save(cartItem)).thenReturn(cartItem);

        // When
        CartEntity result = cartService.updateCartItemQuantity(userId, ticketId, 1);

        // Then
        assertNotNull(result);
        assertEquals(1, cartItem.getQuantity());
        verify(cartRepository).findByUserIdAndTicketId(userId, ticketId);
        verify(cartRepository).save(cartItem);
    }

    @Test
    void testUpdateCartItemQuantity_CartItemNotFound() {
        // Given
        when(cartRepository.findByUserIdAndTicketId(userId, ticketId))
                .thenReturn(Optional.empty());

        // When/Then
        assertThrows(ResourceNotFoundException.class, () -> 
                cartService.updateCartItemQuantity(userId, ticketId, 5));
        verify(cartRepository, never()).save(any());
    }

    @Test
    void testUpdateCartItemQuantity_RejectsGroupedQuantityOnConcreteTicket() {
        // Given
        when(cartRepository.findByUserIdAndTicketId(userId, ticketId))
                .thenReturn(Optional.of(cartItem));

        // When/Then
        assertThrows(ValidationException.class, () ->
                cartService.updateCartItemQuantity(userId, ticketId, 5));
        verify(cartRepository, never()).save(any());
    }

    @Test
    void testUpdateCartItemQuantity_InvalidQuantity_Null() {
        // When/Then
        assertThrows(ValidationException.class, () -> 
                cartService.updateCartItemQuantity(userId, ticketId, null));
        verify(cartRepository, never()).findByUserIdAndTicketId(any(), any());
    }

    @Test
    void testUpdateCartItemQuantity_InvalidQuantity_Zero() {
        // When/Then
        assertThrows(ValidationException.class, () -> 
                cartService.updateCartItemQuantity(userId, ticketId, 0));
        verify(cartRepository, never()).findByUserIdAndTicketId(any(), any());
    }

    @Test
    void testUpdateCartItemQuantity_InvalidQuantity_Negative() {
        // When/Then
        assertThrows(ValidationException.class, () -> 
                cartService.updateCartItemQuantity(userId, ticketId, -1));
        verify(cartRepository, never()).findByUserIdAndTicketId(any(), any());
    }

    // ========== removeItemFromCart Tests ==========

    @Test
    void testRemoveItemFromCart_Success() {
        // Given
        ticket.setTicketStatus(TicketStatus.RESERVED);
        when(cartRepository.findByUserIdAndTicketId(userId, ticketId))
                .thenReturn(Optional.of(cartItem));
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));
        doNothing().when(cartRepository).delete(cartItem);
        doNothing().when(ticketService).markTicketAsAvailable(ticketId);

        // When
        cartService.removeItemFromCart(userId, ticketId);

        // Then
        verify(cartRepository).findByUserIdAndTicketId(userId, ticketId);
        verify(cartRepository).delete(cartItem);
        verify(ticketRepository).findById(ticketId);
        verify(ticketService).markTicketAsAvailable(ticketId);
    }

    @Test
    void testRemoveItemFromCart_CartItemNotFound() {
        // Given
        when(cartRepository.findByUserIdAndTicketId(userId, ticketId))
                .thenReturn(Optional.empty());

        // When/Then
        assertThrows(ResourceNotFoundException.class, () -> 
                cartService.removeItemFromCart(userId, ticketId));
        verify(cartRepository, never()).delete(any());
    }

    @Test
    void testRemoveItemFromCart_TicketNotReserved() {
        // Given
        ticket.setTicketStatus(TicketStatus.AVAILABLE);
        when(cartRepository.findByUserIdAndTicketId(userId, ticketId))
                .thenReturn(Optional.of(cartItem));
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));
        doNothing().when(cartRepository).delete(cartItem);

        // When
        cartService.removeItemFromCart(userId, ticketId);

        // Then
        verify(cartRepository).delete(cartItem);
        verify(ticketService, never()).markTicketAsAvailable(any());
    }

    // ========== getUserCart Tests ==========

    @Test
    void testGetUserCart_Success() {
        // Given
        List<CartEntity> cartItems = new ArrayList<>();
        cartItems.add(cartItem);
        when(userRepository.existsById(userId)).thenReturn(true);
        when(cartRepository.findByUserId(userId)).thenReturn(cartItems);

        // When
        List<CartEntity> result = cartService.getUserCart(userId);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(cartItem.getId(), result.get(0).getId());
        verify(userRepository).existsById(userId);
        verify(cartRepository).findByUserId(userId);
        verify(cartRepository, never()).findByUserIdAndExpiredReservation(any(), any(), any());
        verify(ticketService, never()).markTicketAsAvailable(any());
    }

    @Test
    void testGetUserCart_UserNotFound() {
        // Given
        when(userRepository.existsById(userId)).thenReturn(false);

        // When/Then
        assertThrows(ResourceNotFoundException.class, () -> 
                cartService.getUserCart(userId));
        verify(cartRepository, never()).findByUserId(any());
    }

    @Test
    void testGetUserCart_EmptyCart() {
        // Given
        when(userRepository.existsById(userId)).thenReturn(true);
        when(cartRepository.findByUserId(userId)).thenReturn(new ArrayList<>());

        // When
        List<CartEntity> result = cartService.getUserCart(userId);

        // Then
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ========== releaseExpiredCartReservations Tests ==========

    @Test
    void testReleaseExpiredCartReservations_ReleasesTicketAndDeletesCartRow() {
        // Given
        ticket.setTicketStatus(TicketStatus.RESERVED);
        ticket.setReservedUntil(LocalDateTime.now().minusMinutes(1));
        when(cartRepository.findByUserIdAndExpiredReservation(eq(userId), eq(TicketStatus.RESERVED), any(LocalDateTime.class)))
                .thenReturn(List.of(cartItem));
        doNothing().when(ticketService).markTicketAsAvailable(ticketId);

        // When
        int result = cartService.releaseExpiredCartReservations(userId);

        // Then
        assertEquals(1, result);
        verify(ticketService).markTicketAsAvailable(ticketId);
        verify(cartRepository).delete(cartItem);
    }

    @Test
    void testReleaseExpiredCartReservations_NoExpiredReservations() {
        // Given
        when(cartRepository.findByUserIdAndExpiredReservation(eq(userId), eq(TicketStatus.RESERVED), any(LocalDateTime.class)))
                .thenReturn(List.of());

        // When
        int result = cartService.releaseExpiredCartReservations(userId);

        // Then
        assertEquals(0, result);
        verify(ticketService, never()).markTicketAsAvailable(any());
        verify(cartRepository, never()).delete(any());
    }

    @Test
    void testReleaseExpiredCartReservations_ContinuesWhenTicketReleaseFails() {
        // Given
        ticket.setTicketStatus(TicketStatus.RESERVED);
        ticket.setReservedUntil(LocalDateTime.now().minusMinutes(1));
        when(cartRepository.findByUserIdAndExpiredReservation(eq(userId), eq(TicketStatus.RESERVED), any(LocalDateTime.class)))
                .thenReturn(List.of(cartItem));
        doThrow(new IllegalStateException("Cannot release")).when(ticketService).markTicketAsAvailable(ticketId);

        // When
        int result = cartService.releaseExpiredCartReservations(userId);

        // Then
        assertEquals(0, result);
        verify(ticketService).markTicketAsAvailable(ticketId);
        verify(cartRepository, never()).delete(any());
    }

    // ========== clearCart Tests ==========

    @Test
    void testClearCart_Success() {
        // Given
        List<CartEntity> cartItems = new ArrayList<>();
        cartItems.add(cartItem);
        ticket.setTicketStatus(TicketStatus.RESERVED);
        cartItem.setTicket(ticket);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(cartRepository.findByUser(user)).thenReturn(cartItems);
        doNothing().when(ticketService).markTicketAsAvailable(ticketId);
        doNothing().when(cartRepository).deleteByUser(user);

        // When
        cartService.clearCart(userId);

        // Then
        verify(userRepository).findById(userId);
        verify(cartRepository).findByUser(user);
        verify(ticketService).markTicketAsAvailable(ticketId);
        verify(cartRepository).deleteByUser(user);
    }

    @Test
    void testClearCart_UserNotFound() {
        // Given
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // When/Then
        assertThrows(ResourceNotFoundException.class, () -> 
                cartService.clearCart(userId));
        verify(cartRepository, never()).deleteByUser(any());
    }

    @Test
    void testClearCart_EmptyCart() {
        // Given
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(cartRepository.findByUser(user)).thenReturn(new ArrayList<>());
        doNothing().when(cartRepository).deleteByUser(user);

        // When
        cartService.clearCart(userId);

        // Then
        verify(cartRepository).deleteByUser(user);
        verify(ticketService, never()).markTicketAsAvailable(any());
    }

    // ========== calculateCartTotal Tests ==========

    @Test
    void testCalculateCartTotal_Success() {
        // Given
        List<CartEntity> cartItems = new ArrayList<>();
        cartItems.add(cartItem);

        TicketEntity ticket2 = new TicketEntity();
        ticket2.setId(UUID.randomUUID());
        ticket2.setPrice(new BigDecimal("75.00"));

        CartEntity cartItem2 = new CartEntity();
        cartItem2.setTicket(ticket2);
        cartItem2.setQuantity(1);
        cartItems.add(cartItem2);

        when(userRepository.existsById(userId)).thenReturn(true);
        when(cartRepository.findByUserId(userId)).thenReturn(cartItems);

        // When
        BigDecimal result = cartService.calculateCartTotal(userId);

        // Then
        assertNotNull(result);
        assertEquals(new BigDecimal("125.00"), result);
        verify(userRepository).existsById(userId);
        verify(cartRepository).findByUserId(userId);
        verify(cartRepository, never()).findByUserIdAndExpiredReservation(any(), any(), any());
        verify(ticketService, never()).markTicketAsAvailable(any());
    }

    @Test
    void testCalculateCartTotal_UserNotFound() {
        // Given
        when(userRepository.existsById(userId)).thenReturn(false);

        // When/Then
        assertThrows(ResourceNotFoundException.class, () -> 
                cartService.calculateCartTotal(userId));
        verify(cartRepository, never()).findByUserId(any());
    }

    @Test
    void testCalculateCartTotal_EmptyCart() {
        // Given
        when(userRepository.existsById(userId)).thenReturn(true);
        when(cartRepository.findByUserId(userId)).thenReturn(new ArrayList<>());

        // When
        BigDecimal result = cartService.calculateCartTotal(userId);

        // Then
        assertEquals(BigDecimal.ZERO, result);
    }

    @Test
    void testCalculateCartTotal_NullPrice() {
        // Given
        ticket.setPrice(null);
        List<CartEntity> cartItems = new ArrayList<>();
        cartItems.add(cartItem);

        when(userRepository.existsById(userId)).thenReturn(true);
        when(cartRepository.findByUserId(userId)).thenReturn(cartItems);

        // When
        BigDecimal result = cartService.calculateCartTotal(userId);

        // Then
        assertEquals(BigDecimal.ZERO, result);
    }

    // ========== getCartItemCount Tests ==========

    @Test
    void testGetCartItemCount_Success() {
        // Given
        List<CartEntity> cartItems = new ArrayList<>();
        cartItems.add(cartItem);

        CartEntity cartItem2 = new CartEntity();
        cartItem2.setQuantity(1);
        cartItems.add(cartItem2);

        when(userRepository.existsById(userId)).thenReturn(true);
        when(cartRepository.findByUserId(userId)).thenReturn(cartItems);

        // When
        Integer result = cartService.getCartItemCount(userId);

        // Then
        assertNotNull(result);
        assertEquals(2, result);
        verify(userRepository).existsById(userId);
        verify(cartRepository).findByUserId(userId);
        verify(cartRepository, never()).findByUserIdAndExpiredReservation(any(), any(), any());
        verify(ticketService, never()).markTicketAsAvailable(any());
    }

    @Test
    void testGetCartItemCount_UserNotFound() {
        // Given
        when(userRepository.existsById(userId)).thenReturn(false);

        // When/Then
        assertThrows(ResourceNotFoundException.class, () -> 
                cartService.getCartItemCount(userId));
        verify(cartRepository, never()).findByUserId(any());
    }

    @Test
    void testGetCartItemCount_EmptyCart() {
        // Given
        when(userRepository.existsById(userId)).thenReturn(true);
        when(cartRepository.findByUserId(userId)).thenReturn(new ArrayList<>());

        // When
        Integer result = cartService.getCartItemCount(userId);

        // Then
        assertEquals(0, result);
    }
}
