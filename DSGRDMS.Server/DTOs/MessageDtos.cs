namespace DSGRDMS.Server.DTOs;

public record SendMessageRequest(string GrowerId, string Subject, string Body);
public record SendQueryRequest(string QueryType, string Subject, string Body);
public record AssignQueryRequest(int OfficerUserId);
public record FieldOfficerDto(int Id, string FullName);

public record MessageDto(
    int Id,
    string SenderName,
    string GrowerId,
    string Subject,
    string Body,
    DateTime SentAt,
    bool IsRead,
    bool SentByGrower,
    string? QueryType,
    int? AssignedToUserId,
    string? AssignedToName,
    string? ReplyStatus,
    DateTime? RepliedAt
);

public record ReplyMessageRequest(int MessageId, string ReplyStatus); // "Addressed" or "Need Assistance"
