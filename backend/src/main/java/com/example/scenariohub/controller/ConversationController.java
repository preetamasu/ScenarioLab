package com.example.scenariohub.controller;

import com.example.scenariohub.dtos.CreateTurnRequest;
import com.example.scenariohub.dtos.TurnResponse;
import com.example.scenariohub.model.ConversationTurn;
import com.example.scenariohub.service.ConversationTurnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class ConversationController {

    private final ConversationTurnService conversationTurnService;

    @PostMapping("/sessions/{sessionId}/turns")
    public ResponseEntity<TurnResponse> createConversation(@Valid @RequestBody CreateTurnRequest createTurnRequest, @PathVariable String sessionId, @AuthenticationPrincipal OidcUser user){
        ConversationTurn turn = conversationTurnService.createTurn(sessionId,user.getSubject(),createTurnRequest.audioS3Key());

        TurnResponse response = new TurnResponse(
                turn.getTurnId(),
                turn.getSessionId(),
                turn.getTurnNumber(),
                turn.getAudioS3Key(),
                turn.getTranscript(),
                turn.getCharacterReply(),
                turn.getReplyAudioS3Key(),
                turn.getCreatedAt()
        );

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/sessions/{sessionId}/turns")
    public ResponseEntity<List<TurnResponse>> getConversation(@PathVariable String sessionId, @AuthenticationPrincipal OidcUser user){
        List<ConversationTurn> turns = conversationTurnService.getTurns(sessionId, user.getSubject());

        List<TurnResponse> responses = turns.stream()
                .map(turn -> new TurnResponse(
                        turn.getTurnId(),
                        turn.getSessionId(),
                        turn.getTurnNumber(),
                        turn.getAudioS3Key(),
                        turn.getTranscript(),
                        turn.getCharacterReply(),
                        turn.getReplyAudioS3Key(),
                        turn.getCreatedAt()
                ))
                .toList();

        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @GetMapping("/sessions/{sessionId}/turns/{turnNumber}")
    public ResponseEntity<TurnResponse> getTurn(@PathVariable String sessionId, @PathVariable Integer turnNumber, @AuthenticationPrincipal OidcUser user){
        ConversationTurn turn = conversationTurnService.getTurn(sessionId, user.getSubject(), turnNumber);

        TurnResponse response = new TurnResponse(
                turn.getTurnId(),
                turn.getSessionId(),
                turn.getTurnNumber(),
                turn.getAudioS3Key(),
                turn.getTranscript(),
                turn.getCharacterReply(),
                turn.getReplyAudioS3Key(),
                turn.getCreatedAt()
        );

        return new ResponseEntity<>(response, HttpStatus.OK);
    }


}
