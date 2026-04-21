namespace DSGRDMS.Server.DTOs;

public record FieldVisitDto(
    int Id,
    string GrowerId,
    string VisitType,
    string Title,
    DateTime ScheduledDate,
    string ScheduledTime,
    string Location,
    string Priority,
    string OfficerId,
    string OfficerName,
    string Status,
    string? Notes,
    string? Findings,
    DateTime? CompletedAt
);

public record CreateFieldVisitRequest(
    string GrowerId,
    string VisitType,
    string Title,
    DateTime ScheduledDate,
    string ScheduledTime,
    string Location,
    string Priority,
    string OfficerId,
    string OfficerName,
    string? Notes
);

public record UpdateFieldVisitRequest(
    int Id,
    string Status,
    string? Findings,
    string? Notes
);
public record LogFindingsRequest(
    string Observations,
    string Activities,
    string PlantationCondition,
    string? Notes
);

public record ScheduleVisitRequest(
    string GrowerId,
    DateTime ScheduledDate,
    string ScheduledTime,
    string Purpose,
    string? Notes = null
);