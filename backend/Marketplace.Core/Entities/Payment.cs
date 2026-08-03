namespace Marketplace.Core.Entities;

public enum PaymentStatus
{
    Pending = 0,
    Success = 1,
    Failed = 2
}

public class Payment
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = "COD"; // COD, VNPay
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string TxnRef { get; set; } = string.Empty; // Unique transaction reference code
    public string? VnPayTransactionNo { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }

    public Order? Order { get; set; }
    public ApplicationUser? User { get; set; }
    public ICollection<PaymentLog> Logs { get; set; } = new List<PaymentLog>();
}

public class PaymentLog
{
    public int Id { get; set; }
    public int PaymentId { get; set; }
    public string RawData { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Payment? Payment { get; set; }
}
