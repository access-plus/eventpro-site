package com.accessplus.eventpro.api.scheduler;

import com.accessplus.eventpro.event.ticket.service.TicketService;
import com.accessplus.eventpro.order.cart.service.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Releases ticket reservations that have passed their expiry time (e.g. guest didn't complete payment),
 * then removes any cart rows still pointing at those tickets so UI and inventory stay aligned.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReservationExpiryScheduler {

    private final TicketService ticketService;
    private final CartService cartService;

    /** Run every minute to release expired reservations. */
    @Scheduled(fixedRate = 60_000)
    public void releaseExpiredReservations() {
        try {
            List<UUID> releasedIds = ticketService.releaseExpiredReservations();
            if (!releasedIds.isEmpty()) {
                cartService.removeCartItemsForTicketIds(releasedIds);
                log.debug("Released {} expired ticket reservation(s); cart lines cleared for those tickets", releasedIds.size());
            }
            cartService.removeCartLinesForOrphanAvailableTickets();
        } catch (Exception e) {
            log.warn("Failed to release expired reservations", e);
        }
    }
}
