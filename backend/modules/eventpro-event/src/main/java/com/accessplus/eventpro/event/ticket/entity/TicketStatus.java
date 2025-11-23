package com.accessplus.eventpro.event.ticket.entity;

/**
 * Enum representing ticket status.
 * 
 * <p>Values match the PostgreSQL enum type 'ticket_status' from V1__create_base_tables.sql:
 * <ul>
 *   <li>AVAILABLE - Ticket is available for purchase</li>
 *   <li>SOLD - Ticket has been sold (final state)</li>
 *   <li>RESERVED - Ticket is reserved (in cart or order pending payment)</li>
 * </ul>
 * 
 * <p>State Transitions:
 * <ul>
 *   <li>AVAILABLE → RESERVED (when added to cart or order created)</li>
 *   <li>RESERVED → SOLD (when payment successful)</li>
 *   <li>RESERVED → AVAILABLE (when order cancelled or payment failed)</li>
 *   <li>SOLD → (final state, cannot change)</li>
 * </ul>
 */
public enum TicketStatus {
    AVAILABLE,
    SOLD,
    RESERVED
}

