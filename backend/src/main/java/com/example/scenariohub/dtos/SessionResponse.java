package com.example.scenariohub.dtos;

import java.time.Instant;

public record SessionResponse(
        String sessionId,
        String scenarioId,
        Instant createdAt,
        Instant updatedAt
) {
}
