package com.accessplus.eventpro.event.ticket.service;

import java.io.IOException;
import java.util.UUID;

/**
 * Service interface for QR code generation and management.
 * Handles QR code generation for tickets and uploading to S3.
 * 
 * <p>Features:
 * <ul>
 *   <li>Generate QR code images from ticket ID</li>
 *   <li>Upload QR codes to S3</li>
 *   <li>Retrieve QR code URLs</li>
 * </ul>
 */
public interface QRCodeService {

    /**
     * Generates a QR code image for a ticket.
     * The QR code contains the ticket ID as its content.
     * 
     * @param ticketId the UUID of the ticket
     * @return byte array representing the QR code image (PNG format)
     * @throws IOException if QR code generation fails
     */
    byte[] generateQRCode(UUID ticketId) throws IOException;

    /**
     * Uploads a QR code image to S3.
     * 
     * @param qrCodeImage the QR code image as byte array
     * @param ticketId the UUID of the ticket (used to generate S3 key)
     * @return the S3 URL of the uploaded QR code image
     * @throws IOException if upload fails
     */
    String uploadQRCodeToS3(byte[] qrCodeImage, UUID ticketId) throws IOException;

    /**
     * Gets the S3 URL for a ticket's QR code.
     * 
     * @param ticketId the UUID of the ticket
     * @return the S3 URL of the QR code image, or null if not uploaded
     */
    String getQRCodeUrl(UUID ticketId);

    /**
     * Generates and uploads a QR code for a ticket in one operation.
     * Convenience method that combines generateQRCode and uploadQRCodeToS3.
     * 
     * @param ticketId the UUID of the ticket
     * @return the S3 URL of the uploaded QR code image
     * @throws IOException if generation or upload fails
     */
    String generateAndUploadQRCode(UUID ticketId) throws IOException;
}

