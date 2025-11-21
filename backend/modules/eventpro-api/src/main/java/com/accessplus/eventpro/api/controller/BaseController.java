package com.accessplus.eventpro.api.controller;

import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Base controller for all REST API endpoints.
 * Provides the common `/api/v1` prefix for all controllers.
 */
@RequestMapping("/api/v1")
public abstract class BaseController {
    // This class serves as a base for all controllers
    // Controllers should extend this class to inherit the /api/v1 prefix
}

