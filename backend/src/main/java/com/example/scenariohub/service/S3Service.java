package com.example.scenariohub.service;

import com.example.scenariohub.dtos.AudioUrlResponse;
import com.example.scenariohub.model.ConversationTurn;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3Presigner s3Presigner;
    private final LearningSessionService learningSessionService;
    private final ConversationTurnService conversationTurnService;

    @Value("${aws.s3.audio-bucket}")
    private String audioBucket;

    public AudioUrlResponse createUploadUrl(String sessionId, String userId, String contentType) {
        learningSessionService.getSession(sessionId, userId);

        if (contentType == null || !contentType.startsWith("audio/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Content type must be audio");
        }

        String audioS3Key = "audio-request/" + sessionId + "/uploads/" + UUID.randomUUID();

        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(audioBucket)
                .key(audioS3Key)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(5))
                .putObjectRequest(objectRequest)
                .build();

        String url = s3Presigner.presignPutObject(presignRequest).url().toString();
        return new AudioUrlResponse(url, audioS3Key);
    }

    public AudioUrlResponse createPlaybackUrl(String sessionId, String userId, Integer turnNumber) {
        ConversationTurn turn = conversationTurnService.getTurn(sessionId, userId, turnNumber);
        String audioS3Key = turn.getReplyAudioS3Key();

        if (audioS3Key == null || audioS3Key.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reply audio is not available yet");
        }

        GetObjectRequest objectRequest = GetObjectRequest.builder()
                .bucket(audioBucket)
                .key(audioS3Key)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(5))
                .getObjectRequest(objectRequest)
                .build();

        String url = s3Presigner.presignGetObject(presignRequest).url().toString();
        return new AudioUrlResponse(url, audioS3Key);
    }
}
