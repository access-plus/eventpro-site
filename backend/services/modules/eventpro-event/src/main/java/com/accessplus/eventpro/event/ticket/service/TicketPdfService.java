package com.accessplus.eventpro.event.ticket.service;

import com.accessplus.eventpro.shared.entity.TicketEntity;

import java.io.IOException;

/**
 * Service interface for generating PDF tickets.
 */
public interface TicketPdfService {
    
    /**
     * Generates a PDF ticket with QR code.
     * 
     * @param ticket ticket entity
     * @return PDF as byte array
     * @throws IOException if PDF generation fails
     */
    byte[] generateTicketPdf(TicketEntity ticket) throws IOException;
}

