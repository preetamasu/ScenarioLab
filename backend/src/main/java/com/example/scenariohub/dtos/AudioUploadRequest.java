package com.example.scenariohub.dtos;

import jakarta.validation.constraints.NotBlank;

public record AudioUploadRequest(@NotBlank String contentType) {
}
