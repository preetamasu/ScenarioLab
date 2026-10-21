package com.example.scenariohub.dtos;

import java.time.Instant;

public record TurnResponse(
        String turnId,
        String sessionId,
        Integer turnNumber,
        String audioS3Key, String transcript, String
        characterReply, String
        replyAudioS3Key, Instant createdAt

) {
}
