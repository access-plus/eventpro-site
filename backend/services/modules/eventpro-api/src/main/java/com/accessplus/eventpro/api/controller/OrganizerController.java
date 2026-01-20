package com.accessplus.eventpro.api.controller;

import com.accessplus.eventpro.api.dto.*;
import com.accessplus.eventpro.api.service.OrganizerService;
import com.accessplus.eventpro.core.security.JwtUtils;
import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.event.event.entity.EventEntity;
import com.accessplus.eventpro.event.event.repository.EventRepository;
import com.accessplus.eventpro.event.event.service.EventService;
import com.accessplus.eventpro.event.ticket.service.TicketService;
import com.accessplus.eventpro.shared.entity.TicketEntity;
import com.accessplus.eventpro.shared.exception.ResourceNotFoundException;
import com.accessplus.eventpro.event.service.AWSS3ImageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for organizer operations.
 * 
 * <p>Endpoints:
 * <ul>
 *   <li>GET /api/v1/organizer/events - Get organizer's events</li>
 *   <li>POST /api/v1/organizer/events - Create new event</li>
 *   <li>PUT /api/v1/organizer/events/{id} - Update event</li>
 *   <li>POST /api/v1/organizer/events/upload-image - Upload event image</li>
 *   <li>GET /api/v1/organizer/events/{id}/stats - Get event statistics</li>
 *   <li>GET /api/v1/organizer/events/{id}/attendees - Get event attendees</li>
 *   <li>POST /api/v1/organizer/tickets/{id}/check-in - Check in attendee</li>
 * </ul>
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/organizer")
@RequiredArgsConstructor
@Tag(name = "Organizer", description = "Organizer management API")
@SecurityRequirement(name = "bearerAuth")
public class OrganizerController extends BaseController {

    private final OrganizerService organizerService;
    private final EventService eventService;
    private final TicketService ticketService;
    private final EventRepository eventRepository;
    private final AWSS3ImageService imageService;

    @GetMapping("/events")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @Operation(summary = "Get organizer's events", description = "Returns events created by the authenticated organizer. Requires ORGANIZER or ADMIN role.")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getOrganizerEvents() {
        log.debug("Getting organizer's events");

        // Get current user's UUID from JWT
        UUID organizerId = JwtUtils.getCurrentUserId();

        // Get events by organizer (no pagination for this endpoint)
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        Page<EventEntity> eventPage = eventService.getEventsByOrganizer(organizerId, pageable);

        List<EventResponse> responses = eventPage.getContent().stream()
                .map(EventResponse::fromEntity)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/events")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @Operation(summary = "Create new event", description = "Creates a new event. Requires ORGANIZER or ADMIN role.")
    public ResponseEntity<ApiResponse<EventResponse>> createEvent(
            @Valid @RequestBody CreateEventRequest request) {
        log.debug("Creating new event: name={}", request.getName());

        // Get current user's UUID from JWT
        UUID organizerId = JwtUtils.getCurrentUserId();

        // Create event (reuse existing EventController logic)
        // Note: This would need to be refactored to share logic
        EventEntity event = new EventEntity();
        event.setName(request.getName());
        event.setDescription(request.getDescription());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setMarketingEnabled(request.getMarketingEnabled() != null ? request.getMarketingEnabled() : false);

        try {
            // Parse category UUID from string
            UUID categoryId = UUID.fromString(request.getCategory());
            
            EventEntity createdEvent = eventService.createEvent(
                    event,
                    organizerId,
                    categoryId,
                    null // imageFile - handled separately
            );
            EventResponse response = EventResponse.fromEntity(createdEvent);
            return ResponseEntity.ok(ApiResponse.success(response, "Event created successfully"));
        } catch (Exception e) {
            log.error("Failed to create event: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create event: " + e.getMessage());
        }
    }

    @PutMapping("/events/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @Operation(summary = "Update event", description = "Updates an event. Requires ORGANIZER or ADMIN role.")
    public ResponseEntity<ApiResponse<EventResponse>> updateEvent(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEventRequest request) throws IOException {
        log.debug("Updating event: eventId={}", id);

        // Get current user's UUID from JWT
        UUID organizerId = JwtUtils.getCurrentUserId();

        // Verify event belongs to organizer
        EventEntity event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", id.toString()));
        
        if (!event.getOrganizer().getId().equals(organizerId)) {
            throw new ResourceNotFoundException("Event", id.toString());
        }

        // Create event entity from request
        EventEntity eventUpdate = new EventEntity();
        eventUpdate.setName(request.getName());
        eventUpdate.setDescription(request.getDescription());
        eventUpdate.setStartTime(request.getStartTime());
        eventUpdate.setEndTime(request.getEndTime());
        eventUpdate.setMarketingEnabled(request.getMarketingEnabled() != null ? request.getMarketingEnabled() : false);

        // Parse category UUID from string if provided
        UUID categoryId = null;
        if (request.getCategory() != null) {
            categoryId = UUID.fromString(request.getCategory());
        }
        
        // Update event
        EventEntity updatedEvent = eventService.updateEvent(
                id,
                eventUpdate,
                categoryId,
                null // imageFile - handled separately
        );
        
        EventResponse response = EventResponse.fromEntity(updatedEvent);
        return ResponseEntity.ok(ApiResponse.success(response, "Event updated successfully"));
    }

    @PostMapping("/events/upload-image")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @Operation(summary = "Upload event image", description = "Uploads an image for an event. Requires ORGANIZER or ADMIN role.")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadEventImage(
            @RequestParam("image") MultipartFile imageFile) {
        log.debug("Uploading event image");

        try {
            // Validate image
            imageService.validateImage(imageFile);

            // Generate S3 key: events/{eventId}/{filename}
            String imageKey = String.format("events/%s/%s",
                    UUID.randomUUID(),
                    imageFile.getOriginalFilename() != null ?
                            imageFile.getOriginalFilename() : "image.jpg");

            // Upload image to S3
            String imageUrl = imageService.uploadImage(imageFile, imageKey);

            Map<String, String> response = new HashMap<>();
            response.put("url", imageUrl);

            log.info("Event image uploaded successfully: url={}", imageUrl);
            return ResponseEntity.ok(ApiResponse.success(response, "Image uploaded successfully"));

        } catch (IOException e) {
            log.error("Failed to upload event image: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload image: " + e.getMessage());
        }
    }

    @GetMapping("/events/{id}/stats")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @Operation(summary = "Get event statistics", description = "Returns statistics for an event. Requires ORGANIZER or ADMIN role.")
    public ResponseEntity<ApiResponse<EventStatsResponse>> getEventStats(@PathVariable UUID id) {
        log.debug("Getting event stats: eventId={}", id);

        // Get current user's UUID from JWT
        UUID organizerId = JwtUtils.getCurrentUserId();

        EventStatsResponse stats = organizerService.getEventStats(id, organizerId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/events/{id}/attendees")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @Operation(summary = "Get event attendees", description = "Returns attendees for an event. Requires ORGANIZER or ADMIN role.")
    public ResponseEntity<ApiResponse<List<AttendeeResponse>>> getEventAttendees(@PathVariable UUID id) {
        log.debug("Getting event attendees: eventId={}", id);

        // Get current user's UUID from JWT
        UUID organizerId = JwtUtils.getCurrentUserId();

        List<AttendeeResponse> attendees = organizerService.getEventAttendees(id, organizerId);
        return ResponseEntity.ok(ApiResponse.success(attendees));
    }

    @PostMapping("/tickets/{id}/check-in")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @Operation(summary = "Check in attendee", description = "Checks in an attendee by ticket ID. Requires ORGANIZER or ADMIN role.")
    public ResponseEntity<ApiResponse<Void>> checkInAttendee(@PathVariable UUID id) {
        log.debug("Checking in attendee: ticketId={}", id);

        // Get ticket
        TicketEntity ticket = ticketService.getTicketById(id);
        
        // Verify ticket belongs to organizer's event
        EventEntity event = eventRepository.findById(ticket.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event", ticket.getEventId().toString()));

        // Get current user's UUID from JWT
        UUID organizerId = JwtUtils.getCurrentUserId();

        if (!event.getOrganizer().getId().equals(organizerId)) {
            throw new ResourceNotFoundException("Ticket", id.toString());
        }

        // Check in ticket
        ticketService.checkInTicket(id);
        
        log.info("Attendee checked in: ticketId={}", id);
        return ResponseEntity.ok(ApiResponse.success(null, "Attendee checked in successfully"));
    }
}
