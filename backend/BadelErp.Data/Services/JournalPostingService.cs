using BadelErp.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BadelErp.Data.Services;

/// <summary>سطر مسودة قيد — مدين أو دائن فقط (وليس الاثنان).</summary>
public sealed record JournalLineDraft(
    int AccountId,
    decimal Debit,
    decimal Credit,
    int? CostCenterId = null,
    int? PartyId = null,
    string? Description = null);

/// <summary>مسودة قيد يومية جاهزة للترحيل.</summary>
public sealed record JournalEntryDraft(
    int CompanyId,
    int FiscalYearId,
    DateOnly EntryDate,
    int CurrencyId,
    IReadOnlyList<JournalLineDraft> Lines,
    string? EntryNo = null,
    int? BranchId = null,
    decimal ExchangeRate = 1m,
    string? Description = null,
    string SourceType = "manual",
    string? SourceId = null,
    int? CreatedByUserId = null);

public sealed record JournalPostResult(long EntryId, string EntryNo, decimal DebitTotal, decimal CreditTotal);

/// <summary>رمز خطأ قابل للعرض للمستخدم.</summary>
public sealed class ErpValidationException(string message) : Exception(message);

/// <summary>
/// محرّك القيود: يتحقّق من التوازن والقيود المحاسبية ثم يُرحّل القيد
/// داخل معاملة واحدة (ACID)، ويعيد رقم القيد المولَّد من سلسلة الترقيم.
/// </summary>
public sealed class JournalPostingService(ErpDbContext db)
{
    private readonly ErpDbContext _db = db;

    public async Task<JournalPostResult> PostAsync(
        JournalEntryDraft draft,
        CancellationToken cancellationToken = default)
    {
        Validate(draft);

        var debitTotal = draft.Lines.Sum(l => l.Debit);
        var creditTotal = draft.Lines.Sum(l => l.Credit);

        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);

        var entryNo = draft.EntryNo ?? await NextNumberAsync(draft.CompanyId, "journal", cancellationToken);

        var entry = new JournalEntry
        {
            CompanyId = draft.CompanyId,
            BranchId = draft.BranchId,
            FiscalYearId = draft.FiscalYearId,
            EntryNo = entryNo,
            EntryDate = draft.EntryDate,
            SourceType = draft.SourceType,
            SourceId = draft.SourceId,
            CurrencyId = draft.CurrencyId,
            ExchangeRate = draft.ExchangeRate,
            Description = draft.Description,
            Status = "draft",
            CreatedByUserId = draft.CreatedByUserId,
        };

        _db.JournalEntries.Add(entry);
        await _db.SaveChangesAsync(cancellationToken);

        var lineNo = 1;
        foreach (var line in draft.Lines)
        {
            _db.JournalLines.Add(new JournalLine
            {
                EntryId = entry.EntryId,
                LineNumber = lineNo++,
                AccountId = line.AccountId,
                CostCenterId = line.CostCenterId,
                PartyId = line.PartyId,
                Debit = line.Debit,
                Credit = line.Credit,
                DebitBase = Math.Round(line.Debit * draft.ExchangeRate, 4),
                CreditBase = Math.Round(line.Credit * draft.ExchangeRate, 4),
                Description = line.Description,
            });
        }

        await _db.SaveChangesAsync(cancellationToken);

        entry.Status = "posted";
        entry.PostedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return new JournalPostResult(entry.EntryId, entry.EntryNo, debitTotal, creditTotal);
    }

    /// <summary>ميزان المراجعة للحسابات القابلة للترحيل (من العرض المحسوب).</summary>
    public async Task<IReadOnlyList<TrialBalanceRow>> GetTrialBalanceAsync(
        int companyId,
        CancellationToken cancellationToken = default)
    {
        return await _db.Database
            .SqlQuery<TrialBalanceRow>($"""
                SELECT Code, NameAr, TotalDebit, TotalCredit, Balance
                FROM dbo.v_trial_balance
                WHERE CompanyId = {companyId}
                ORDER BY Code
                """)
            .ToListAsync(cancellationToken);
    }

    private static void Validate(JournalEntryDraft draft)
    {
        if (draft.Lines.Count < 2)
            throw new ErpValidationException("القيد يحتاج سطرين على الأقل.");

        foreach (var line in draft.Lines)
        {
            if (line.Debit < 0 || line.Credit < 0)
                throw new ErpValidationException("لا يُسمح بقيم سالبة في المدين أو الدائن.");

            if (line.Debit > 0 && line.Credit > 0)
                throw new ErpValidationException("السطر لا يمكن أن يكون مدينًا ودائنًا في الوقت نفسه.");
        }

        var debit = draft.Lines.Sum(l => l.Debit);
        var credit = draft.Lines.Sum(l => l.Credit);

        if (Math.Round(debit, 4) != Math.Round(credit, 4))
            throw new ErpValidationException($"القيد غير متوازن: المدين {debit:0.00} ≠ الدائن {credit:0.00}.");

        if (debit <= 0)
            throw new ErpValidationException("إجمالي القيد يجب أن يكون أكبر من صفر.");
    }

    private async Task<string> NextNumberAsync(
        int companyId,
        string docTypeCode,
        CancellationToken cancellationToken)
    {
        var sequence = await _db.NumberSequences
            .FirstOrDefaultAsync(
                s => s.CompanyId == companyId && s.BranchId == null && s.DocTypeCode == docTypeCode,
                cancellationToken);

        if (sequence is null)
        {
            sequence = new NumberSequence
            {
                CompanyId = companyId,
                DocTypeCode = docTypeCode,
                Prefix = "JV",
                NextNumber = 1,
                PadWidth = 6,
            };
            _db.NumberSequences.Add(sequence);
        }

        var number = $"{sequence.Prefix}{sequence.NextNumber.ToString().PadLeft(sequence.PadWidth, '0')}";
        sequence.NextNumber += 1;
        await _db.SaveChangesAsync(cancellationToken);
        return number;
    }
}

/// <summary>صف ميزان المراجعة.</summary>
public sealed class TrialBalanceRow
{
    public string Code { get; set; } = null!;
    public string NameAr { get; set; } = null!;
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public decimal Balance { get; set; }
}
