package com.accessplus.eventpro.api.scheduler;

import com.accessplus.eventpro.event.ticket.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Releases ticket reservations that have passed their expiry time (e.g. guest didn't complete payment).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReservationExpiryScheduler {

    private final TicketService ticketService;

    /** Run every minute to release expired reservations. */
    @Scheduled(fixedRate = 60_000)
    public void releaseExpiredReservations() {
        try {
            int released = ticketService.releaseExpiredReservations();
            if (released > 0) {
                log.debug("Released {} expired ticket reservation(s)", released);
            }
        } catch (Exception e) {
            log.warn("Failed to release expired reservations: {}", e.getMessage());
        }
    }
}
