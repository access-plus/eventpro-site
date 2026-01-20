package com.accessplus.eventpro.api.controller;

import com.accessplus.eventpro.api.dto.ApiResponse;
import com.accessplus.eventpro.api.dto.CreateEventRequest;
import com.accessplus.eventpro.api.dto.EventResponse;
import com.accessplus.eventpro.api.dto.TicketTypeResponse;
import com.accessplus.eventpro.api.dto.UpdateEventRequest;
import com.accessplus.eventpro.shared.exception.ResourceNotFoundException;
import com.accessplus.eventpro.shared.exception.ValidationException;
import com.accessplus.eventpro.core.security.JwtUtils;
import com.accessplus.eventpro.core.user.service.UserService;
import com.accessplus.eventpro.event.category.entity.CategoryEntity;
import com.accessplus.eventpro.event.category.repository.CategoryRepository;
import com.accessplus.eventpro.event.event.entity.EventEntity;
import com.accessplus.eventpro.event.event.repository.EventRepository;
import com.accessplus.eventpro.event.event.service.EventService;
import com.accessplus.eventpro.event.ticket.service.TicketService;
import com.accessplus.eventpro.shared.entity.TicketEntity;
import com.accessplus.eventpro.shared.enums.TicketStatus;
import com.accessplus.eventpro.shared.enums.TicketType;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST controller for event management operations.
 * 
     * <p>Endpoints:
     * <ul>
     *   <li>POST /api/v1/events - Create event (admin/organizer only, multipart/form-data)</li>
     *   <li>GET /api/v1/events/{id} - Get event by ID (public)</li>
     *   <li>GET /api/v1/events - Get all events (public, paginated, searchable)</li>
     *   <li>GET /api/v1/events/{id}/ticket-types - Get ticket types for event (public)</li>
     *   <li>GET /api/v1/events/my-events - Get events user has purchased tickets for (authenticated)</li>
     *   <li>GET /api/v1/events/category/{categoryName} - Get events by category (public)</li>
     *   <li>PATCH /api/v1/events/{id} - Update event (admin/organizer only)</li>
     *   <li>DELETE /api/v1/events/{id} - Delete event (admin/organizer only)</li>
     * </ul>
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
@Tag(name = "Events", description = "Event management API")
public class EventController extends BaseController {

    private final EventService eventService;
    private final UserService userService;
    private final CategoryRepository categoryRepository;
    private final EventRepository eventRepository;
    private final TicketService ticketService;
    private final ObjectMapper objectMapper;

    /**
     * Creates a new event with optional image upload.
     * 
     * <p>Content-Type: multipart/form-data
     * <ul>
     *   <li>request (String, JSON) - EventCreateRequest</li>
     *   <li>imageFile (MultipartFile) - Optional event image</li>
     * </ul>
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('ORGANIZER')")
    @Operation(summary = "Create event", description = "Creates a new event with optional image upload. " +
            "Requires ADMIN or ORGANIZER role. Content-Type must be multipart/form-data with 'request' (JSON string) and optional 'imageFile' parts.")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<EventResponse>> createEvent(
            @RequestPart("request") String requestJson,
            @RequestPart(value = "imageFile", required = false) MultipartFile imageFile) {
        log.debug("Creating event with imageFile: {}", imageFile != null ? imageFile.getOriginalFilename() : "none");

        try {
            // Parse JSON request
            CreateEventRequest request = objectMapper.readValue(requestJson, CreateEventRequest.class);
            
            // Validate request
            validateCreateRequest(request);
            
            // Get current user (organizer)
            UUID userId = JwtUtils.getCurrentUserId();
            com.accessplus.eventpro.core.user.entity.UserEntity organizer = userService.getUserById(userId);
            
            // Resolve category (by UUID or name)
            UUID categoryId = resolveCategoryId(request.getCategory());
            
            // Create EventEntity from request
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
            
            // Create event via service
            EventEntity createdEvent = eventService.createEvent(
                    event,
                    organizer.getId(),
                    categoryId,
                    imageFile
            );
            
            EventResponse response = EventResponse.fromEntity(createdEvent);
            return ResponseEntity.ok(ApiResponse.success(response, "Event created successfully"));
            
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            log.error("Failed to parse request JSON: {}", e.getMessage(), e);
            throw new ValidationException("Invalid request JSON format: " + e.getMessage());
        } catch (IOException e) {
            log.error("Failed to create event: {}", e.getMessage(), e);
            throw new ValidationException("Failed to process request: " + e.getMessage());
        }
    }

    /**
     * Retrieves an event by ID.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get event by ID", description = "Returns event details by ID. Public endpoint.")
    public ResponseEntity<ApiResponse<EventResponse>> getEventById(@PathVariable UUID id) {
        log.debug("Getting event by ID: {}", id);

        EventEntity event = eventService.getEventById(id);
        EventResponse response = EventResponse.fromEntity(event);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Retrieves all events with pagination and optional search.
     */
    @GetMapping
    @Operation(summary = "Get all events", description = "Returns paginated list of all events. " +
            "Supports search by keyword (name). Public endpoint.")
    public ResponseEntity<ApiResponse<Page<EventResponse>>> getAllEvents(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "startTime") String sortBy,
            @RequestParam(defaultValue = "asc") String dir,
            @RequestParam(required = false) String keyword) {
        log.debug("Getting all events: page={}, size={}, sortBy={}, dir={}, keyword={}", 
                page, size, sortBy, dir, keyword);

        // Convert page from 1-based to 0-based
        int pageIndex = page > 0 ? page - 1 : 0;
        
        // Validate sort direction
        Sort.Direction direction = "desc".equalsIgnoreCase(dir) 
                ? Sort.Direction.DESC 
                : Sort.Direction.ASC;
        
        // Create pageable with sorting
        Pageable pageable = PageRequest.of(pageIndex, size, Sort.by(direction, sortBy));
        
        Page<EventEntity> eventPage;
        
        // Apply search filter if keyword provided
        if (keyword != null && !keyword.trim().isEmpty()) {
            eventPage = eventRepository.findByNameContainingIgnoreCase(keyword.trim(), pageable);
        } else {
            eventPage = eventService.getAllEvents(pageable);
        }
        
        Page<EventResponse> responsePage = eventPage.map(EventResponse::fromEntity);

        return ResponseEntity.ok(ApiResponse.success(responsePage));
    }

    /**
     * Retrieves events by category name.
     * 
     * <p>Note: Uses categoryName, not categoryId, as per README.md specification.
     */
    @GetMapping("/category/{categoryName}")
    @Operation(summary = "Get events by category", description = "Returns list of events in the specified category. " +
            "Uses category name, not ID. Public endpoint.")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getEventsByCategory(
            @PathVariable String categoryName) {
        log.debug("Getting events by category: {}", categoryName);

        // Find category by name
        CategoryEntity category = categoryRepository.findByName(categoryName)
                .orElseThrow(() -> new ResourceNotFoundException("Category", categoryName));
        
        // Get events by category (no pagination for this endpoint per README.md)
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        Page<EventEntity> eventPage = eventService.getEventsByCategory(category.getId(), pageable);
        
        List<EventResponse> responses = eventPage.getContent().stream()
                .map(EventResponse::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
     * Retrieves ticket types for an event.
     * 
     * @param id event UUID
     * @return List of TicketTypeResponse
     */
    @GetMapping("/{id}/ticket-types")
    @Operation(summary = "Get ticket types for event", description = "Returns ticket types with availability information for an event. Public endpoint.")
    public ResponseEntity<ApiResponse<List<TicketTypeResponse>>> getTicketTypes(@PathVariable UUID id) {
        log.debug("Getting ticket types for event: eventId={}", id);

        // Validate event exists
        EventEntity event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", id.toString()));

        // Get grouped tickets and availability
        Map<TicketType, List<TicketEntity>> groupedTickets = ticketService.groupTicketsByType(id);
        Map<TicketType, Long> availability = ticketService.checkTicketAvailability(id);

        // Build TicketTypeResponse list
        List<TicketTypeResponse> ticketTypes = new ArrayList<>();
        for (Map.Entry<TicketType, List<TicketEntity>> entry : groupedTickets.entrySet()) {
            TicketType type = entry.getKey();
            List<TicketEntity> tickets = entry.getValue();

            if (!tickets.isEmpty()) {
                // Get price from first ticket (assuming all tickets of same type have same price)
                BigDecimal price = tickets.get(0).getPrice();
                
                // Get sale start/end times from first ticket
                LocalDateTime saleStartDate = tickets.get(0).getStartTime();
                LocalDateTime saleEndDate = tickets.get(0).getEndTime();
                
                // Calculate quantities
                int totalQuantity = tickets.size();
                long availableCount = availability.getOrDefault(type, 0L);
                
                // Determine status
                String status;
                if (availableCount == 0) {
                    status = "SOLD_OUT";
                } else if (availableCount < totalQuantity) {
                    status = "ACTIVE";
                } else {
                    status = "ACTIVE";
                }

                TicketTypeResponse ticketType = TicketTypeResponse.builder()
                        .id(type.name()) // Use enum name as ID
                        .eventId(id)
                        .name(type.name())
                        .description(null) // Can be enhanced later
                        .price(price)
                        .totalQuantity(totalQuantity)
                        .availableQuantity((int) availableCount)
                        .saleStartDate(saleStartDate)
                        .saleEndDate(saleEndDate)
                        .status(status)
                        .build();

                ticketTypes.add(ticketType);
            }
        }

        return ResponseEntity.ok(ApiResponse.success(ticketTypes));
    }

    /**
     * Retrieves events where the authenticated user has purchased tickets.
     * 
     * @return List of EventResponse
     */
    @GetMapping("/my-events")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'ORGANIZER')")
    @Operation(summary = "Get my events", description = "Returns events where the authenticated user has purchased tickets. " +
            "Requires USER, ADMIN, or ORGANIZER role.")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getMyEvents() {
        log.debug("Getting events for current user");

        // Get current user's UUID from JWT
        UUID userId = JwtUtils.getCurrentUserId();

        // Get events where user has purchased tickets (no pagination for this endpoint)
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        Page<EventEntity> eventPage = eventService.getEventsByUserPurchases(userId, pageable);

        List<EventResponse> responses = eventPage.getContent().stream()
                .map(EventResponse::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
     * Updates an existing event.
     * 
     * <p>Note: imageFile is sent as a query parameter, not in request body, per README.md specification.
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ORGANIZER')")
    @Operation(summary = "Update event", description = "Updates an existing event. " +
            "Requires ADMIN or ORGANIZER role. All fields are optional. " +
            "imageFile can be provided as a query parameter.")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<EventResponse>> updateEvent(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEventRequest request,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile) {
        log.debug("Updating event: id={}", id);

        try {
            // Create EventEntity with update fields
            EventEntity eventUpdate = new EventEntity();
            eventUpdate.setName(request.getName());
            eventUpdate.setDescription(request.getDescription());
            eventUpdate.setStartTime(request.getStartTime());
            eventUpdate.setEndTime(request.getEndTime());
            eventUpdate.setMarketingEnabled(request.getMarketingEnabled());
            
            // Set address if provided
            if (request.getAddress() != null) {
                eventUpdate.setAddress(request.getAddress().toEntity());
            }
            
            // Resolve category ID if provided
            UUID categoryId = null;
            if (request.getCategory() != null) {
                categoryId = resolveCategoryId(request.getCategory());
            }
            
            // Update event via service
            EventEntity updatedEvent = eventService.updateEvent(id, eventUpdate, categoryId, imageFile);
            
            EventResponse response = EventResponse.fromEntity(updatedEvent);
            return ResponseEntity.ok(ApiResponse.success(response, "Event updated successfully"));
            
        } catch (IOException e) {
            log.error("Failed to update event: {}", e.getMessage(), e);
            throw new ValidationException("Failed to update event: " + e.getMessage());
        }
    }

    /**
     * Deletes an event by ID.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ORGANIZER')")
    @Operation(summary = "Delete event", description = "Deletes an event by ID. " +
            "Requires ADMIN or ORGANIZER role.")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(@PathVariable UUID id) {
        log.debug("Deleting event: id={}", id);

        eventService.deleteEvent(id);
        
        return ResponseEntity.ok(ApiResponse.success(null, "Event deleted successfully"));
    }

    /**
     * Resolves category ID from UUID string or category name.
     * 
     * @param categoryIdentifier UUID string or category name
     * @return Category UUID
     * @throws ResourceNotFoundException if category not found
     */
    private UUID resolveCategoryId(String categoryIdentifier) {
        if (categoryIdentifier == null || categoryIdentifier.trim().isEmpty()) {
            throw new ValidationException("Category is required");
        }
        
        // Try to parse as UUID first
        try {
            UUID categoryUuid = UUID.fromString(categoryIdentifier);
            // Verify category exists
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

    /**
     * Validates CreateEventRequest.
     */
    private void validateCreateRequest(CreateEventRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new ValidationException("Event name is required");
        }
        if (request.getStartTime() == null) {
            throw new ValidationException("Event start time is required");
        }
        if (request.getEndTime() == null) {
            throw new ValidationException("Event end time is required");
        }
        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new ValidationException("Event end time must be after start time");
        }
        if (request.getCategory() == null || request.getCategory().trim().isEmpty()) {
            throw new ValidationException("Category is required");
        }
        if (request.getAddress() == null) {
            throw new ValidationException("Address is required");
        }
        if (request.getAddress().getCity() == null || request.getAddress().getCity().trim().isEmpty()) {
            throw new ValidationException("Address city is required");
        }
        if (request.getAddress().getCountry() == null || request.getAddress().getCountry().trim().isEmpty()) {
            throw new ValidationException("Address country is required");
        }
    }
}
