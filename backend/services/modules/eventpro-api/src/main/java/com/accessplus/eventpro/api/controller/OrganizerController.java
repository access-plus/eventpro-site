package com.accessplus.eventpro.api.controller;

import com.accessplus.eventpro.api.dto.*;
import com.accessplus.eventpro.api.service.OrganizerService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.accessplus.eventpro.core.security.JwtUtils;
import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.core.user.repository.UserRepository;
import com.accessplus.eventpro.event.category.entity.CategoryEntity;
import com.accessplus.eventpro.event.category.repository.CategoryRepository;
import com.accessplus.eventpro.event.addon.entity.EventAddonEntity;
import com.accessplus.eventpro.event.addon.repository.EventAddonRepository;
import com.accessplus.eventpro.event.event.entity.EventEntity;
import com.accessplus.eventpro.event.event.repository.EventRepository;
import com.accessplus.eventpro.event.event.service.EventService;
import com.accessplus.eventpro.event.ticket.service.TicketService;
import com.accessplus.eventpro.shared.entity.TicketEntity;
import com.accessplus.eventpro.shared.exception.ResourceNotFoundException;
import com.accessplus.eventpro.shared.exception.ValidationException;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;


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
    private final EventAddonRepository eventAddonRepository;
    private final CategoryRepository categoryRepository;
    private final AWSS3ImageService imageService;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;

    /** Merchandise & add-ons require Pro or Enterprise per pricing page. */
    private void requireAddonsEligible() {
        UUID userId = JwtUtils.getCurrentUserId();
        UserEntity user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));
        String tier = user.getSubscriptionTier() != null ? user.getSubscriptionTier().toUpperCase() : "BASIC";
        if (!"PRO".equals(tier) && !"ENTERPRISE".equals(tier)) {
            throw new AccessDeniedException("Merchandise and add-ons require a Pro or Enterprise plan. Upgrade at /pricing.");
        }
    }

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

        // Resolve category by UUID or name
        UUID categoryId = resolveCategoryId(request.getCategory());

        // Create event (aligned with EventController logic)
        EventEntity event = new EventEntity();
        event.setName(request.getName());
        event.setDescription(request.getDescription());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setMarketingEnabled(request.getMarketingEnabled() != null ? request.getMarketingEnabled() : false);

        // Set address if provided
        if (request.getAddress() != null) {
            event.setAddress(request.getAddress().toEntity());
        }

        try {
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
        if (request.getImageUrl() != null) {
            eventUpdate.setImageUrl(request.getImageUrl());
        }

        // Set address if provided
        if (request.getAddress() != null) {
            eventUpdate.setAddress(request.getAddress().toEntity());
        }

        // Resolve category by UUID or name if provided
        UUID categoryId = null;
        if (request.getCategory() != null && !request.getCategory().trim().isEmpty()) {
            categoryId = resolveCategoryId(request.getCategory());
        }

        // Update event (no image in this JSON-only endpoint; use POST /events/upload-image to change image)
        EventEntity updatedEvent = eventService.updateEvent(
                id,
                eventUpdate,
                categoryId,
                null
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

    @GetMapping("/events/{eventId}/addons")
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @Operation(summary = "List event add-ons", description = "Returns add-ons for an event. Requires Pro or Enterprise plan.")
    public ResponseEntity<ApiResponse<List<EventAddonResponse>>> getEventAddons(@PathVariable UUID eventId) {
        requireAddonsEligible();
        log.debug("Getting add-ons for event: {}", eventId);
        UUID organizerId = JwtUtils.getCurrentUserId();
        EventEntity event = eventRepository.findByIdWithOrganizer(eventId).orElseThrow(() -> new ResourceNotFoundException("Event", eventId.toString()));
        if (!event.getOrganizer().getId().equals(organizerId)) {
            throw new ResourceNotFoundException("Event", eventId.toString());
        }
        List<EventAddonEntity> addons = eventAddonRepository.findByEventIdOrderByDisplayOrderAsc(eventId);
        List<EventAddonResponse> responses = addons.stream().map(EventAddonResponse::fromEntity).toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/events/{eventId}/addons")
    @Transactional
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @Operation(summary = "Create event add-on", description = "Creates an add-on for an event. Requires Pro or Enterprise plan.")
    public ResponseEntity<ApiResponse<EventAddonResponse>> createEventAddon(
            @PathVariable UUID eventId,
            @Valid @RequestBody CreateEventAddonRequest request) throws JsonProcessingException {
        requireAddonsEligible();
        log.debug("Creating add-on for event: {}", eventId);
        UUID organizerId = JwtUtils.getCurrentUserId();
        EventEntity event = eventRepository.findById(eventId).orElseThrow(() -> new ResourceNotFoundException("Event", eventId.toString()));
        if (!event.getOrganizer().getId().equals(organizerId)) {
            throw new ResourceNotFoundException("Event", eventId.toString());
        }
        EventAddonEntity entity = new EventAddonEntity();
        entity.setEvent(event);
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setPrice(request.getPrice());
        entity.setCategory(request.getCategory());
        entity.setImageUrl(request.getImageUrl());
        entity.setIsPopular(request.getIsPopular() != null ? request.getIsPopular() : false);
        entity.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0);
        if (request.getSizes() != null && !request.getSizes().isEmpty()) {
            entity.setSizesJson(objectMapper.writeValueAsString(request.getSizes()));
        }
        entity = eventAddonRepository.save(entity);
        return ResponseEntity.ok(ApiResponse.success(EventAddonResponse.fromEntity(entity), "Add-on created"));
    }

    @PutMapping("/events/{eventId}/addons/{addonId}")
    @Transactional
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @Operation(summary = "Update event add-on", description = "Updates an add-on. Requires Pro or Enterprise plan.")
    public ResponseEntity<ApiResponse<EventAddonResponse>> updateEventAddon(
            @PathVariable UUID eventId,
            @PathVariable UUID addonId,
            @Valid @RequestBody UpdateEventAddonRequest request) throws JsonProcessingException {
        requireAddonsEligible();
        log.debug("Updating add-on: {}", addonId);
        UUID organizerId = JwtUtils.getCurrentUserId();
        EventEntity event = eventRepository.findById(eventId).orElseThrow(() -> new ResourceNotFoundException("Event", eventId.toString()));
        if (!event.getOrganizer().getId().equals(organizerId)) {
            throw new ResourceNotFoundException("Event", eventId.toString());
        }
        EventAddonEntity entity = eventAddonRepository.findById(addonId).orElseThrow(() -> new ResourceNotFoundException("EventAddon", addonId.toString()));
        if (!entity.getEvent().getId().equals(eventId)) {
            throw new ResourceNotFoundException("EventAddon", addonId.toString());
        }
        if (request.getName() != null) entity.setName(request.getName());
        if (request.getDescription() != null) entity.setDescription(request.getDescription());
        if (request.getPrice() != null) entity.setPrice(request.getPrice());
        if (request.getCategory() != null) entity.setCategory(request.getCategory());
        if (request.getImageUrl() != null) entity.setImageUrl(request.getImageUrl());
        if (request.getIsPopular() != null) entity.setIsPopular(request.getIsPopular());
        if (request.getDisplayOrder() != null) entity.setDisplayOrder(request.getDisplayOrder());
        if (request.getSizes() != null) {
            entity.setSizesJson(request.getSizes().isEmpty() ? null : objectMapper.writeValueAsString(request.getSizes()));
        }
        entity = eventAddonRepository.save(entity);
        return ResponseEntity.ok(ApiResponse.success(EventAddonResponse.fromEntity(entity), "Add-on updated"));
    }

    @DeleteMapping("/events/{eventId}/addons/{addonId}")
    @Transactional
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @Operation(summary = "Delete event add-on", description = "Deletes an add-on. Requires Pro or Enterprise plan.")
    public ResponseEntity<ApiResponse<Void>> deleteEventAddon(@PathVariable UUID eventId, @PathVariable UUID addonId) {
        requireAddonsEligible();
        log.debug("Deleting add-on: {}", addonId);
        UUID organizerId = JwtUtils.getCurrentUserId();
        EventEntity event = eventRepository.findById(eventId).orElseThrow(() -> new ResourceNotFoundException("Event", eventId.toString()));
        if (!event.getOrganizer().getId().equals(organizerId)) {
            throw new ResourceNotFoundException("Event", eventId.toString());
        }
        EventAddonEntity entity = eventAddonRepository.findById(addonId).orElseThrow(() -> new ResourceNotFoundException("EventAddon", addonId.toString()));
        if (!entity.getEvent().getId().equals(eventId)) {
            throw new ResourceNotFoundException("EventAddon", addonId.toString());
        }
        eventAddonRepository.delete(entity);
        return ResponseEntity.ok(ApiResponse.success(null, "Add-on deleted"));
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

    private UUID resolveCategoryId(String categoryIdentifier) {
        if (categoryIdentifier == null || categoryIdentifier.trim().isEmpty()) {
            throw new ValidationException("Category is required");
        }

        // Try to parse as UUID first
        try {
            UUID categoryUuid = UUID.fromString(categoryIdentifier);
            categoryRepository.findById(categoryUuid)
                    .orElseThrow(() -> new ResourceNotFoundException("Category", categoryIdentifier));
            return categoryUuid;
        } catch (IllegalArgumentException e) {
            // Not a UUID, try to find by name
            CategoryEntity category = categoryRepository.findByName(categoryIdentifier)
                    .orElseThrow(() -> new ResourceNotFoundException("Category", categoryIdentifier));
            return category.getId();
        }
    }

    @PostMapping("/events/{eventId}/tickets")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @Operation(summary = "Create tickets for event", description = "Creates tickets for an event. Requires ORGANIZER or ADMIN role.")
    public ResponseEntity<ApiResponse<List<TicketEntity>>> createTickets(
            @PathVariable UUID eventId,
            @Valid @RequestBody CreateTicketsRequest request) {
        log.debug("Creating tickets: eventId={}, type={}, quantity={}", eventId, request.getTicketType(), request.getQuantity());

        // Get current user's UUID from JWT
        UUID organizerId = JwtUtils.getCurrentUserId();

        // Verify event exists and belongs to organizer
        EventEntity event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", eventId.toString()));

        if (!event.getOrganizer().getId().equals(organizerId)) {
            throw new ValidationException("You can only create tickets for your own events");
        }

        // Create tickets using the ticket service
        List<TicketEntity> createdTickets = ticketService.createTickets(
                eventId,
                organizerId,
                request.getTicketType(),
                request.getPrice(),
                request.getQuantity(),
                request.getName() != null ? request.getName() : request.getTicketType().name() + " Ticket",
                request.getSaleStartDate(),
                request.getSaleEndDate()
        );

        log.info("Successfully created {} tickets for event: eventId={}", createdTickets.size(), eventId);
        return ResponseEntity.ok(ApiResponse.success(createdTickets,
                createdTickets.size() + " tickets created successfully"));
    }
}
