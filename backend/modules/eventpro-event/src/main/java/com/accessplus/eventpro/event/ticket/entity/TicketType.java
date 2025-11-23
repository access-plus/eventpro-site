package com.accessplus.eventpro.event.ticket.entity;

/**
 * Enum representing ticket types.
 * 
 * <p>Values match the PostgreSQL enum type 'ticket_type' from V1__create_base_tables.sql:
 * <ul>
 *   <li>VIP - Premium ticket type</li>
 *   <li>REGULAR - Standard ticket type</li>
 *   <li>EARLY_BIRD - Early bird discount ticket type</li>
 * </ul>
 */
public enum TicketType {
    VIP,
    REGULAR,
    EARLY_BIRD
}

