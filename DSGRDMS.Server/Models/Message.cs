namespace DSGRDMS.Server.Models;

public class Message
{
    public int Id { get; set; }
    public int SenderUserId { get; set; }               // staff userId, or 0 when sent by grower
    public string SenderName { get; set; } = string.Empty;
    public string GrowerId { get; set; } = string.Empty;   // grower involved (G001 etc.)
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; } = false;
    public bool SentByGrower { get; set; } = false;     // true = grower query to staff
    public string? QueryType { get; set; }              // category when sent by grower
}
