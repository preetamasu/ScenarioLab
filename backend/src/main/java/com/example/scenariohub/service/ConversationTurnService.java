package com.example.scenariohub.service;

import com.example.scenariohub.model.ConversationTurn;
import com.example.scenariohub.model.LearningSession;
import com.example.scenariohub.repository.ConversationTurnRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConversationTurnService {

    private final ConversationTurnRepository conversationTurnRepository;
    private final LearningSessionService learningSessionService;
    private final SQSService sqsService;

    public ConversationTurn createTurn(String sessionId, String userId, String audioS3Key) {
       LearningSession session =  learningSessionService.getSession(sessionId, userId);

        if (audioS3Key == null || audioS3Key.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Audio S3 key is required");
        }

        int nextTurnNumber = conversationTurnRepository.findBySessionId(sessionId).stream()
                .mapToInt(ConversationTurn::getTurnNumber)
                .max().orElse(0) + 1;

        ConversationTurn turn = new ConversationTurn();
        turn.setTurnId(UUID.randomUUID().toString());
        turn.setSessionId(sessionId);
        turn.setTurnNumber(nextTurnNumber);
        turn.setAudioS3Key(audioS3Key);
        turn.setCreatedAt(Instant.now());

        ConversationTurn turn1 = conversationTurnRepository.save(turn);
        sqsService.sendTurn(turn1,session.getScenarioId());
        return turn1 ;
    }

    public ConversationTurn getTurn(String sessionId, String userId, Integer turnNumber) {
        learningSessionService.getSession(sessionId, userId);

        if (turnNumber == null || turnNumber < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Turn number must be positive");
        }

        return conversationTurnRepository.findById(sessionId, turnNumber)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turn not found"));
    }

    public List<ConversationTurn> getTurns(String sessionId, String userId) {
        learningSessionService.getSession(sessionId, userId);
        return conversationTurnRepository.findBySessionId(sessionId);
    }
}
