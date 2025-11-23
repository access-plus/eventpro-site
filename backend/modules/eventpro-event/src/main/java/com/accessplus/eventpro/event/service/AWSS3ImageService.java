package com.accessplus.eventpro.event.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Service interface for AWS S3 image operations.
 * Handles image upload, deletion, and URL generation for event images.
 */
public interface AWSS3ImageService {

    /**
     * Uploads an image file to S3.
     * 
     * @param file the multipart file to upload
     * @param key the S3 object key (path) where the image will be stored
     * @return the S3 URL of the uploaded image
     * @throws IOException if file upload fails
     * @throws IllegalArgumentException if file validation fails (size, format)
     */
    String uploadImage(MultipartFile file, String key) throws IOException;

    /**
     * Deletes an image from S3.
     * 
     * @param key the S3 object key (path) of the image to delete
     * @throws IOException if deletion fails
     */
    void deleteImage(String key) throws IOException;

    /**
     * Generates a presigned URL for an image in S3.
     * Useful for temporary access to private images.
     * 
     * @param key the S3 object key (path) of the image
     * @param expirationMinutes expiration time in minutes for the presigned URL
     * @return presigned URL for the image
     */
    String getPresignedUrl(String key, int expirationMinutes);

    /**
     * Gets the public URL for an image in S3.
     * Assumes the bucket/object has public read access.
     * 
     * @param key the S3 object key (path) of the image
     * @return public URL for the image
     */
    String getImageUrl(String key);

    /**
     * Validates an image file.
     * Checks file size, format (JPEG, PNG, WebP), and other constraints.
     * 
     * @param file the file to validate
     * @throws IllegalArgumentException if validation fails
     */
    void validateImage(MultipartFile file);
}

