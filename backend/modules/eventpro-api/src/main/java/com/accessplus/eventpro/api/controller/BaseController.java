package com.accessplus.eventpro.api.controller;

import org.springframework.web.bind.annotation.CrossOrigin;

/**
 * Base controller for all REST API endpoints.
 * Provides CORS configuration for the frontend application.
 * 
 * Note: Spring MVC does not inherit @RequestMapping from abstract classes.
 * Each controller must explicitly include the full path including /api/v1 prefix.
 */
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"})
public abstract class BaseController {
    // This class serves as a base for CORS configuration
    // Controllers should extend this class and include /api/v1 in their @RequestMapping
}

