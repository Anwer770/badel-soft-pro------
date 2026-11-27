using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace BadelErp.Data;

/// <summary>
/// مصنع السياق لوقت التصميم (dotnet ef). سلسلة الاتصال تُقرأ من
/// متغيّر البيئة BADEL_DB أو من القيمة الافتراضية أدناه.
/// </summary>
public sealed class ErpDbContextFactory : IDesignTimeDbContextFactory<ErpDbContext>
{
    private const string DefaultConnectionString =
        "Server=localhost;Database=BadelErp;Trusted_Connection=True;TrustServerCertificate=True;";

    public ErpDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("BADEL_DB") ?? DefaultConnectionString;

        var options = new DbContextOptionsBuilder<ErpDbContext>()
            .UseSqlServer(connectionString, sql =>
            {
                sql.CommandTimeout(120);
                sql.EnableRetryOnFailure(3);
            })
            .Options;

        return new ErpDbContext(options);
    }

    /// <summary>سلسلة الاتصال المستخدمة فعليًا (للاستخدام في برامج التشغيل).</summary>
    public static string ResolveConnectionString(string? explicitConnectionString = null) =>
        explicitConnectionString
        ?? Environment.GetEnvironmentVariable("BADEL_DB")
        ?? DefaultConnectionString;
}
