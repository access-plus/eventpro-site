package com.accessplus.eventpro.event.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface AWSS3ImageService {

    String uploadImage(MultipartFile file, String key) throws IOException;

    void deleteImage(String key) throws IOException;

    String getPresignedUrl(String key, int expirationMinutes);

    String getImageUrl(String key);

    void validateImage(MultipartFile file);
}

