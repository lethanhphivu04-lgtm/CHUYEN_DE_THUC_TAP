namespace Marketplace.Core.Entities;

public enum TransactionType
{
    SaleRevenue = 0,
    Withdrawal = 1,
    Refund = 2
}

public enum WithdrawalStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public class SellerWallet
{
    public int Id { get; set; }
    public int SellerId { get; set; }
    public decimal Balance { get; set; } = 0;
    public decimal LockedBalance { get; set; } = 0;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Seller? Seller { get; set; }
    public ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();
}

public class WalletTransaction
{
    public int Id { get; set; }
    public int WalletId { get; set; }
    public decimal Amount { get; set; }
    public TransactionType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public SellerWallet? Wallet { get; set; }
}

public class WithdrawalRequest
{
    public int Id { get; set; }
    public int SellerId { get; set; }
    public decimal Amount { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountHolder { get; set; } = string.Empty;
    public WithdrawalStatus Status { get; set; } = WithdrawalStatus.Pending;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }

    public Seller? Seller { get; set; }
}
