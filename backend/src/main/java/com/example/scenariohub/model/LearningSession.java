package com.example.scenariohub.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class LearningSession {

    @Getter(onMethod_ = @DynamoDbPartitionKey)
    private String sessionId;

    private String userId;

    private String scenarioId;

    private Instant createdAt;

    private Instant updatedAt;

    private List<ConversationTurn> conversationTurns;
}
