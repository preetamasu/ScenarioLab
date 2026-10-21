package com.example.scenariohub.dtos;

import jakarta.validation.constraints.NotBlank;

public record CreateTurnRequest(@NotBlank String audioS3Key) {
}
