package com.example.scenariohub.controller;

import com.example.scenariohub.dtos.AudioUploadRequest;
import com.example.scenariohub.dtos.AudioUrlResponse;
import com.example.scenariohub.service.S3Service;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class AudioController {

    private final S3Service s3Service;

    @PostMapping("/sessions/{sessionId}/audio/upload-url")
    public ResponseEntity<AudioUrlResponse> createUploadUrl(
            @PathVariable String sessionId,
            @Valid @RequestBody AudioUploadRequest request,
            @AuthenticationPrincipal OidcUser user) {
        return ResponseEntity.ok(s3Service.createUploadUrl(sessionId, user.getSubject(), request.contentType()));
    }

    @GetMapping("/sessions/{sessionId}/turns/{turnNumber}/audio-url")
    public ResponseEntity<AudioUrlResponse> createPlaybackUrl(
            @PathVariable String sessionId,
            @PathVariable Integer turnNumber,
            @AuthenticationPrincipal OidcUser user) {
        return ResponseEntity.ok(s3Service.createPlaybackUrl(sessionId, user.getSubject(), turnNumber));
    }
}
