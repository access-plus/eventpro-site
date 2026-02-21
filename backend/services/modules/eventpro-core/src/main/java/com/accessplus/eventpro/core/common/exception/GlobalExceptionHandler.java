package com.accessplus.eventpro.core.common.exception;

import com.accessplus.eventpro.shared.exception.BusinessException;
import com.accessplus.eventpro.shared.exception.ConflictException;
import com.accessplus.eventpro.shared.exception.ErrorResponse;
import com.accessplus.eventpro.shared.exception.ResourceNotFoundException;
import com.accessplus.eventpro.shared.exception.UnauthorizedException;
import com.accessplus.eventpro.shared.exception.ValidationException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(
            BusinessException ex, WebRequest request) {
        logger.warn("Business exception: {}", ex.getMessage());
        
        HttpStatus status = determineHttpStatus(ex);
        String path = extractPath(request);
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(ex.getMessage())
                .path(path)
                .timestamp(Instant.now())
                .build();
        
        return new ResponseEntity<>(errorResponse, status);
    }
    
    /**
     * Handle resource not found exceptions.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {
        logger.warn("Resource not found: {}", ex.getMessage());
        
        String path = extractPath(request);
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(ex.getMessage())
                .path(path)
                .timestamp(Instant.now())
                .build();
        
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            ValidationException ex, WebRequest request) {
        logger.warn("Validation error: {}", ex.getMessage());
        
        String path = extractPath(request);
        // Note: ValidationException has List<String> errors, not field-specific
        // Fields map is only populated when we have field-level errors (e.g., MethodArgumentNotValidException)
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(ex.getMessage())
                .path(path)
                .timestamp(Instant.now())
                .build();
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorizedException(
            UnauthorizedException ex, WebRequest request) {
        logger.warn("Unauthorized: {}", ex.getMessage());
        
        String path = extractPath(request);
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(ex.getMessage())
                .path(path)
                .timestamp(Instant.now())
                .build();
        
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }
    
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflictException(
            ConflictException ex, WebRequest request) {
        logger.warn("Conflict: {}", ex.getMessage());
        
        String path = extractPath(request);
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(ex.getMessage())
                .path(path)
                .timestamp(Instant.now())
                .build();
        
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, WebRequest request) {
        logger.warn("Validation error: {}", ex.getMessage());
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        String message = "Validation failed: " + errors.values().stream()
                .collect(Collectors.joining(", "));
        
        String path = extractPath(request);
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(message)
                .path(path)
                .timestamp(Instant.now())
                .fields(errors) // Field-specific validation errors
                .build();
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex, WebRequest request) {
        logger.warn("Constraint violation: {}", ex.getMessage());
        
        String message = ex.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining(", "));
        
        String path = extractPath(request);
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message("Validation failed: " + message)
                .path(path)
                .timestamp(Instant.now())
                .build();
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(
            AccessDeniedException ex, WebRequest request) {
        logger.warn("Access denied: {}", ex.getMessage());
        
        String path = extractPath(request);
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message("You do not have permission to access this resource")
                .path(path)
                .timestamp(Instant.now())
                .build();
        
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }
    
    @ExceptionHandler(AuthenticationCredentialsNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(
            AuthenticationCredentialsNotFoundException ex, WebRequest request) {
        logger.warn("Authentication error: {}", ex.getMessage());
        
        String path = extractPath(request);
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message("Authentication required")
                .path(path)
                .timestamp(Instant.now())
                .build();
        
        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex, WebRequest request) {
        logger.error("Unexpected error occurred", ex);
        
        String path = extractPath(request);
        String detail = ex.getClass().getSimpleName() + ": " + (ex.getMessage() != null ? ex.getMessage() : "");
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message("An unexpected error occurred. Please try again later.")
                .path(path)
                .timestamp(Instant.now())
                .detail(detail)
                .build();
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    private String extractPath(WebRequest request) {
        String description = request.getDescription(false);
        return description.replace("uri=", "");
    }
    
    private HttpStatus determineHttpStatus(BusinessException ex) {
        return switch (ex.getErrorCode()) {
            case "RESOURCE_NOT_FOUND" -> HttpStatus.NOT_FOUND;
            case "VALIDATION_ERROR" -> HttpStatus.BAD_REQUEST;
            case "UNAUTHORIZED", "ACCESS_DENIED" -> HttpStatus.FORBIDDEN;
            case "CONFLICT" -> HttpStatus.CONFLICT;
            default -> HttpStatus.BAD_REQUEST;
        };
    }
}

