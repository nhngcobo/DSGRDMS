namespace DSGRDMS.Server.Models;

public static class DocumentTypes
{
    public record DocType(int Id, string Name, bool IsRequired, string Category);

    public static readonly IReadOnlyList<DocType> All =
    [
        new(1, "Proof of Land Ownership / Lease Agreement", true,  "Legal"),
        new(2, "Environmental Impact Assessment (EIA)",      true,  "Environmental"),
        new(3, "Water Use License",                          true,  "Legal"),
        new(4, "FSC / PEFC Certification",                   false, "Certification"),
        new(5, "Community Development Plan",                 false, "Operational"),
        new(6, "Fire Management Plan",                       true,  "Operational"),
        new(7, "Invasive Species Management Plan",           true,  "Environmental"),
        new(8, "Pest & Disease Management Plan",             false, "Certification"),
    ];
}
