package com.example.scenariohub.repository;

import com.example.scenariohub.model.ConversationTurn;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ConversationTurnRepository {
    private final DynamoDbEnhancedClient dynamoDbEnhancedClient;
    private DynamoDbTable<ConversationTurn> conversationTurnDynamoDbTable;

    @Value("${aws.dynamodb.turn-table:ConversationTurns}")
    private String turnTableName;

    @PostConstruct
    public void init() {
        conversationTurnDynamoDbTable = dynamoDbEnhancedClient.table(
                turnTableName, TableSchema.fromBean(ConversationTurn.class));
    }

    public ConversationTurn save(ConversationTurn turn) {
        conversationTurnDynamoDbTable.putItem(turn);
        return turn;
    }

    public Optional<ConversationTurn> findById(String sessionId, Integer turnNumber) {
        return Optional.ofNullable(conversationTurnDynamoDbTable.getItem(
                r -> r.key(k -> k.partitionValue(sessionId).sortValue(turnNumber))));
    }

    public List<ConversationTurn> findBySessionId(String sessionId) {
        List<ConversationTurn> turns = new ArrayList<>();
        conversationTurnDynamoDbTable.query(r -> r
                        .queryConditional(QueryConditional.keyEqualTo(
                                k -> k.partitionValue(sessionId)))
                        .scanIndexForward(true))
                .items().forEach(turns::add);
        return turns;
    }

    public void deleteById(String sessionId, Integer turnNumber) {
        conversationTurnDynamoDbTable.deleteItem(
                r -> r.key(k -> k.partitionValue(sessionId).sortValue(turnNumber)));
    }
}
