package com.example.scenariohub.repository;

import com.example.scenariohub.model.LearningSession;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class LearningSessionRepository {
    private final DynamoDbEnhancedClient dynamoDbEnhancedClient;
    private DynamoDbTable<LearningSession> learningSessionDynamoDbTable;

    @Value("${aws.dynamodb.session-table:LearningSessions}")
    private String sessionTableName;

    @PostConstruct
    public void init() {
        learningSessionDynamoDbTable = dynamoDbEnhancedClient.table(
                sessionTableName, TableSchema.fromBean(LearningSession.class));
    }

    public LearningSession save(LearningSession session) {
        learningSessionDynamoDbTable.putItem(session);
        return session;
    }

    public Optional<LearningSession> findById(String sessionId) {
        return Optional.ofNullable(learningSessionDynamoDbTable.getItem(
                r -> r.key(k -> k.partitionValue(sessionId))));
    }

    public List<LearningSession> findAll() {
        List<LearningSession> sessions = new ArrayList<>();
        learningSessionDynamoDbTable.scan().items().forEach(sessions::add);
        return sessions;
    }

    public void deleteById(String sessionId) {
        learningSessionDynamoDbTable.deleteItem(r -> r.key(k -> k.partitionValue(sessionId)));
    }
}
