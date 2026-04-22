namespace DSGRDMS.Server.DTOs;

public record SendMessageRequest(string GrowerId, string Subject, string Body);

public record MessageDto(
    int Id,
    string SenderName,
    string GrowerId,
    string Subject,
    string Body,
    DateTime SentAt,
    bool IsRead
);

// New query system DTOs
public record SubmitQueryRequest(
    string Subject,
    string Body,
    string? QueryType,  // plants_not_growing, documents, equipment, pests, general
    string Priority = "medium"  // low, medium, high
);

public record QueryDto(
    int Id,
    string GrowerId,
    string SenderName,
    string Subject,
    string Body,
    string QueryType,
    string Status,
    string Priority,
    string? AssignedToName,
    DateTime SentAt,
    bool IsRead
);

public record AssignQueryRequest(int AssignedToUserId, string? AssignedToName);

public record UpdateQueryStatusRequest(string Status);  // open, assigned, in_progress, resolved, closed
