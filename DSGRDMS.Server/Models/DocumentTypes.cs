namespace DSGRDMS.Server.Models;

public static class DocumentTypes
{
    public record DocType(int Id, string Name, bool IsRequired, string Category);

    public static readonly IReadOnlyList<DocType> All =
    [
        // Registration requirements (required)
        new(1,  "Plantation Declaration",                          true,  "Operational"),
        new(2,  "Permit to Occupy / KHONZA Letter / Annexure A",  true,  "Legal"),
        new(3,  "Water Use License",                               true,  "Environmental"),
        new(4,  "FSC / PEFC Certification",                        true,  "Certification"),
        // Verification / intake documents (required)
        new(5,  "ID Document",                                     true,  "Legal"),
        new(6,  "CIPC Documents",                                  true,  "Legal"),
        new(7,  "Bank Account Details",                            true,  "Operational"),
        new(8,  "Grower Intake Form",                              true,  "Operational"),
        // Supplementary documents (optional)
        new(9,  "Proof of Land Ownership / Lease Agreement",      false, "Legal"),
        new(10, "Environmental Impact Assessment (EIA)",           false, "Environmental"),
        new(11, "Community Development Plan",                      false, "Operational"),
        new(12, "Fire Management Plan",                            false, "Operational"),
        new(13, "Invasive Species Management Plan",                false, "Environmental"),
        // Agreement (final step — required but not counted in compliance score)
        new(14, "Signed Grower Agreement",                         false, "Legal"),
    ];
}
