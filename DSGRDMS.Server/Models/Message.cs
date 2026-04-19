namespace DSGRDMS.Server.Models;

public class Message
{
    public int Id { get; set; }
    public int SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string GrowerId { get; set; } = string.Empty;   // recipient grower's GrowerId (e.g. G001)
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; } = false;
}
