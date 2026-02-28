package com.accessplus.eventpro.api.service;

import com.accessplus.eventpro.api.dto.SubmitVerificationRequest;
import com.accessplus.eventpro.api.dto.VerificationStatusResponse;

import java.util.UUID;

public interface VerificationService {

    VerificationStatusResponse getStatus(UUID organizerId);

    void submitVerification(UUID organizerId, SubmitVerificationRequest request);
}
