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
    
    // New query system fields
    public string MessageType { get; set; } = "direct";  // direct (staff→grower), query (grower→system)
    public string? QueryType { get; set; }  // plants_not_growing, documents, equipment, pests, general, etc.
    public string Status { get; set; } = "open";  // open, assigned, in_progress, resolved, closed
    public int? AssignedToUserId { get; set; }  // field officer assigned to handle this query
    public string? AssignedToName { get; set; }
    public string Priority { get; set; } = "medium";  // low, medium, high
}
