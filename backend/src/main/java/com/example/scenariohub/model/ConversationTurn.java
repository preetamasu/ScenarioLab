package com.example.scenariohub.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.time.Instant;


@Data
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class ConversationTurn {

    private String turnId;

    @Getter(onMethod_ = @DynamoDbPartitionKey)
    private String sessionId;

    @Getter(onMethod_ = @DynamoDbSortKey)
    private Integer turnNumber;

    private String audioS3Key;

    private String transcript;

    private String characterReply;

    private String replyAudioS3Key;

    private Instant createdAt;


}
