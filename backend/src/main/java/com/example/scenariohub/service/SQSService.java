package com.example.scenariohub.service;

import com.example.scenariohub.model.ConversationTurn;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class SQSService {

    private final SqsTemplate sqsTemplate;

    @Value("${aws.sqs.queue-url}")
    private String queueUrl;

    public void sendTurn(ConversationTurn turn, String scenarioId) {

        Map<String, Object> payload = Map.of(
                "session_id", turn.getSessionId(),
                "turn_id", turn.getTurnId(),
                "turn_number", turn.getTurnNumber(),
                "scenario_id", scenarioId,
                "audio_s3_key", turn.getAudioS3Key()
        );

        sqsTemplate.send(to -> to
                .queue(queueUrl)
                .payload(payload)
                .messageGroupId(turn.getSessionId())
                .messageDeduplicationId(turn.getTurnId())
        );
    }
}