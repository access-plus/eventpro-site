package com.accessplus.eventpro.api.controller;

import com.accessplus.eventpro.event.service.AWSS3ImageService;
import com.accessplus.eventpro.event.service.S3ObjectContent;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

/**
 * Proxies S3 image requests so the browser can load event images when direct S3/LocalStack
 * access returns 403 (e.g. LocalStack bucket policy not applied to anonymous browser requests).
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/images")
@RequiredArgsConstructor
@Tag(name = "Images", description = "Image proxy for S3 objects")
public class ImageProxyController extends BaseController {

    private final AWSS3ImageService s3ImageService;

    @GetMapping("/proxy")
    @Operation(summary = "Proxy S3 image", description = "Streams an image from S3 by key or full URL. Use when direct S3 URL returns 403 (e.g. LocalStack).")
    public ResponseEntity<byte[]> proxyImage(
            @RequestParam(required = false) String key,
            @RequestParam(required = false) String url) {
        String keyOrUrl = key != null && !key.isBlank() ? key : url;
        if (keyOrUrl == null || keyOrUrl.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            String decoded = URLDecoder.decode(keyOrUrl.trim(), StandardCharsets.UTF_8);
            // Only allow keys that look like our event/profile paths (security)
            if (!isAllowedKeyOrUrl(decoded)) {
                log.warn("Image proxy rejected disallowed key/url: {}", decoded);
                return ResponseEntity.status(403).build();
            }
            S3ObjectContent content = s3ImageService.getObject(decoded);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(content.getContentType()));
            headers.setCacheControl("public, max-age=3600");
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(content.getContent());
        } catch (IOException e) {
            log.debug("Image proxy failed: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    private static boolean isAllowedKeyOrUrl(String keyOrUrl) {
        String normalized = keyOrUrl;
        // If it's a URL, accept if it contains our allowed path prefixes
        if (normalized.contains("events/") || normalized.contains("profile-pictures/")) {
            return true;
        }
        return normalized.startsWith("events/") || normalized.startsWith("profile-pictures/");
    }
}
