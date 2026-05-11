package com.accessplus.eventpro.api.controller;

public abstract class BaseController {
    // CORS is configured centrally in SecurityConfig from eventpro.cors.allowed-origins.
    // Controllers should extend this class and include /api/v1 in their @RequestMapping
}
