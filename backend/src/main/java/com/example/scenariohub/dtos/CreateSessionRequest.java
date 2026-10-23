package com.example.scenariohub.dtos;

import jakarta.validation.constraints.NotBlank;

public record CreateSessionRequest(
        @NotBlank
String scenarioId
) {
}
