package com.example.scenariohub.controller;

import com.example.scenariohub.dtos.CreateSessionRequest;
import com.example.scenariohub.dtos.SessionResponse;
import com.example.scenariohub.model.LearningSession;
import com.example.scenariohub.service.LearningSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class LearningSessionController {

    private final LearningSessionService learningSessionService;


    @PostMapping("/sessions")
    public ResponseEntity<SessionResponse> createSession(@Valid @RequestBody CreateSessionRequest createSessionRequest, @AuthenticationPrincipal OidcUser user){
        LearningSession session = learningSessionService.createSession(user.getSubject(),createSessionRequest.scenarioId());
        SessionResponse sessionResponse = new SessionResponse(
                session.getSessionId(),
                session.getScenarioId(),
                session.getCreatedAt(),
                session.getUpdatedAt()
        );

        return new ResponseEntity<>(sessionResponse, HttpStatus.CREATED);
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<SessionResponse> getSession(@PathVariable String sessionId, @AuthenticationPrincipal OidcUser user){

        LearningSession learningSession = learningSessionService.getSession(sessionId,user.getSubject());

        SessionResponse sessionResponse = new SessionResponse(
                learningSession.getSessionId(),
                learningSession.getScenarioId(),
                learningSession.getCreatedAt(),
                learningSession.getUpdatedAt()
        );

        return new ResponseEntity<>(sessionResponse,HttpStatus.OK);

    }

}
