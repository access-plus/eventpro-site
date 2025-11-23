package com.accessplus.eventpro.event.service.impl;

import com.accessplus.eventpro.event.config.S3Config;
import com.accessplus.eventpro.event.service.AWSS3ImageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Implementation of AWS S3 image service.
 * Handles image upload, deletion, and URL generation for event images.
 * 
 * <p>Features:
 * <ul>
 *   <li>Image validation (size, format: JPEG, PNG, WebP)</li>
 *   <li>Automatic key generation with UUID prefix</li>
 *   <li>Content type detection</li>
 *   <li>Presigned URL generation for temporary access</li>
 *   <li>Public URL generation</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AWSS3ImageServiceImpl implements AWSS3ImageService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            ".jpg", ".jpeg", ".png", ".webp"
    );

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final S3Config s3Config;

    /**
     * Uploads an image file to S3.
     * 
     * @param file the multipart file to upload
     * @param key the S3 object key (path) where the image will be stored
     * @return the S3 URL of the uploaded image
     * @throws IOException if file upload fails
     * @throws IllegalArgumentException if file validation fails
     */
    @Override
    public String uploadImage(MultipartFile file, String key) throws IOException {
        log.debug("Uploading image to S3: key={}, size={}", key, file.getSize());

        // Validate image before upload
        validateImage(file);

        // Generate unique key if not provided
        String finalKey = key != null && !key.isEmpty() ? key : generateImageKey(file.getOriginalFilename());

        try {
            // Determine content type
            String contentType = file.getContentType();
            if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
                contentType = determineContentType(file.getOriginalFilename());
            }

            // Build PutObjectRequest
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(s3Config.getBucketName())
                    .key(finalKey)
                    .contentType(contentType)
                    .contentLength(file.getSize())
                    .acl(ObjectCannedACL.PUBLIC_READ) // Make image publicly readable
                    .build();

            // Upload file
            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            // Generate and return public URL
            String imageUrl = getImageUrl(finalKey);
            log.info("Successfully uploaded image to S3: key={}, url={}", finalKey, imageUrl);
            return imageUrl;

        } catch (S3Exception e) {
            log.error("Failed to upload image to S3: key={}, error={}", finalKey, e.getMessage(), e);
            throw new IOException("Failed to upload image to S3: " + e.getMessage(), e);
        }
    }

    /**
     * Deletes an image from S3.
     * 
     * @param key the S3 object key (path) of the image to delete
     * @throws IOException if deletion fails
     */
    @Override
    public void deleteImage(String key) throws IOException {
        if (key == null || key.isEmpty()) {
            log.warn("Attempted to delete image with empty key");
            return;
        }

        log.debug("Deleting image from S3: key={}", key);

        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(s3Config.getBucketName())
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("Successfully deleted image from S3: key={}", key);

        } catch (S3Exception e) {
            log.error("Failed to delete image from S3: key={}, error={}", key, e.getMessage(), e);
            throw new IOException("Failed to delete image from S3: " + e.getMessage(), e);
        }
    }

    /**
     * Generates a presigned URL for an image in S3.
     * Useful for temporary access to private images.
     * 
     * @param key the S3 object key (path) of the image
     * @param expirationMinutes expiration time in minutes for the presigned URL
     * @return presigned URL for the image
     */
    @Override
    public String getPresignedUrl(String key, int expirationMinutes) {
        if (key == null || key.isEmpty()) {
            throw new IllegalArgumentException("S3 key cannot be null or empty");
        }

        log.debug("Generating presigned URL for image: key={}, expiration={} minutes", key, expirationMinutes);

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(s3Config.getBucketName())
                .key(key)
                .build();

        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(
                presignerBuilder -> presignerBuilder
                        .signatureDuration(Duration.ofMinutes(expirationMinutes))
                        .getObjectRequest(getObjectRequest)
        );

        return presignedRequest.url().toString();
    }

    /**
     * Gets the public URL for an image in S3.
     * Assumes the bucket/object has public read access.
     * 
     * @param key the S3 object key (path) of the image
     * @return public URL for the image
     */
    @Override
    public String getImageUrl(String key) {
        if (key == null || key.isEmpty()) {
            throw new IllegalArgumentException("S3 key cannot be null or empty");
        }

        // Extract key from full URL if provided
        String actualKey = extractKeyFromUrl(key);

        // Build public URL
        // Format: https://{bucket}.s3.{region}.amazonaws.com/{key}
        // For LocalStack: http://localhost:4566/{bucket}/{key}
        String bucketName = s3Config.getBucketName();
        // Get region from S3Config (which reads from application.yml)
        // The region is already configured in S3Config, so we'll use a default approach
        String region = "us-east-1"; // Default, can be overridden via config

        // Check if using LocalStack (endpoint override)
        String endpoint = s3Config.getS3Endpoint();
        if (endpoint != null && !endpoint.isEmpty()) {
            // LocalStack format: http://localhost:4566/{bucket}/{key}
            return String.format("%s/%s/%s", endpoint, bucketName, actualKey);
        } else {
            // AWS format: https://{bucket}.s3.{region}.amazonaws.com/{key}
            return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, actualKey);
        }
    }

    /**
     * Validates an image file.
     * Checks file size, format (JPEG, PNG, WebP), and other constraints.
     * 
     * @param file the file to validate
     * @throws IllegalArgumentException if validation fails
     */
    @Override
    public void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file cannot be null or empty");
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    String.format("Image file size exceeds maximum allowed size of %d MB", MAX_FILE_SIZE / (1024 * 1024))
            );
        }

        // Check content type
        String contentType = file.getContentType();
        if (contentType != null && !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                    String.format("Image content type '%s' is not allowed. Allowed types: %s", contentType, ALLOWED_CONTENT_TYPES)
            );
        }

        // Check file extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            String extension = getFileExtension(originalFilename).toLowerCase();
            if (!ALLOWED_EXTENSIONS.contains(extension)) {
                throw new IllegalArgumentException(
                        String.format("Image file extension '%s' is not allowed. Allowed extensions: %s", extension, ALLOWED_EXTENSIONS)
                );
            }
        } else if (contentType == null) {
            // If no filename and no content type, we can't validate
            throw new IllegalArgumentException("Cannot validate image: missing filename and content type");
        }
    }

    /**
     * Generates a unique S3 key for an image.
     * Format: events/{uuid}-{original-filename}
     * 
     * @param originalFilename the original filename
     * @return generated S3 key
     */
    private String generateImageKey(String originalFilename) {
        String uuid = UUID.randomUUID().toString();
        String filename = originalFilename != null ? originalFilename : "image";
        String extension = getFileExtension(filename);
        return String.format("events/%s%s", uuid, extension);
    }

    /**
     * Gets the file extension from a filename.
     * 
     * @param filename the filename
     * @return file extension (including dot), or empty string if no extension
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastDotIndex);
    }

    /**
     * Determines content type from filename extension.
     * 
     * @param filename the filename
     * @return content type, or "image/jpeg" as default
     */
    private String determineContentType(String filename) {
        if (filename == null) {
            return "image/jpeg";
        }
        String extension = getFileExtension(filename).toLowerCase();
        return switch (extension) {
            case ".jpg", ".jpeg" -> "image/jpeg";
            case ".png" -> "image/png";
            case ".webp" -> "image/webp";
            default -> "image/jpeg";
        };
    }

    /**
     * Extracts the S3 key from a full URL.
     * If the input is already a key, returns it as-is.
     * 
     * @param urlOrKey the URL or key
     * @return extracted key
     */
    private String extractKeyFromUrl(String urlOrKey) {
        // If it's already a key (no http/https), return as-is
        if (!urlOrKey.startsWith("http://") && !urlOrKey.startsWith("https://")) {
            return urlOrKey;
        }

        // Extract key from URL
        // Format: https://{bucket}.s3.{region}.amazonaws.com/{key}
        // or: http://localhost:4566/{bucket}/{key}
        try {
            if (urlOrKey.contains("/" + s3Config.getBucketName() + "/")) {
                int keyStartIndex = urlOrKey.indexOf("/" + s3Config.getBucketName() + "/") + s3Config.getBucketName().length() + 1;
                return urlOrKey.substring(keyStartIndex);
            } else if (urlOrKey.contains(".s3.")) {
                // AWS format: https://bucket.s3.region.amazonaws.com/key
                int keyStartIndex = urlOrKey.indexOf(".s3.") + 4;
                keyStartIndex = urlOrKey.indexOf("/", keyStartIndex) + 1;
                return urlOrKey.substring(keyStartIndex);
            }
        } catch (Exception e) {
            log.warn("Failed to extract key from URL: {}, using as-is", urlOrKey, e);
        }

        return urlOrKey;
    }
}

