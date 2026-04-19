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
