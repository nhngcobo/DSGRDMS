namespace DSGRDMS.Server.Models;

public static class DocumentTypes
{
    public record DocType(int Id, string Name, bool IsRequired);

    public static readonly IReadOnlyList<DocType> All =
    [
        new(1, "Proof of Land Ownership / Lease Agreement", true),
        new(2, "Environmental Impact Assessment (EIA)",      true),
        new(3, "Water Use License",                          true),
        new(4, "FSC / PEFC Certification",                   false),
        new(5, "Community Development Plan",                 false),
        new(6, "Fire Management Plan",                       true),
        new(7, "Invasive Species Management Plan",           true),
        new(8, "Pest & Disease Management Plan",             false),
    ];
}
