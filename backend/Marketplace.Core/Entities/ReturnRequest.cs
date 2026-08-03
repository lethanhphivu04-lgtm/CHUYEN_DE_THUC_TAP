using System;

namespace Marketplace.Core.Entities;

public enum ReturnStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public class ReturnRequest
{
    public int Id { get; set; }
    public int SubOrderId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public decimal RefundAmount { get; set; }
    public ReturnStatus Status { get; set; } = ReturnStatus.Pending;
    public string? AdminNote { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }

    public SubOrder? SubOrder { get; set; }
    public ApplicationUser? User { get; set; }
}
