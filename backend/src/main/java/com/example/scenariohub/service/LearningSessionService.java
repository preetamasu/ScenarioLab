package com.example.scenariohub.service;


import com.example.scenariohub.model.LearningSession;
import com.example.scenariohub.repository.LearningSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LearningSessionService {

    private final LearningSessionRepository learningSessionRepository;

    public LearningSession createSession(String userId, String scenarioId) {
        LearningSession session = new LearningSession();
        Instant now = Instant.now();

        session.setSessionId(UUID.randomUUID().toString());
        session.setUserId(userId);
        session.setScenarioId(scenarioId);

        session.setCreatedAt(now);
        session.setUpdatedAt(now);

        return learningSessionRepository.save(session);
    }


    public LearningSession getSession(String sessionId, String userId) {
        LearningSession session = learningSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        if (userId == null || !userId.equals(session.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        return session;
    }
}
