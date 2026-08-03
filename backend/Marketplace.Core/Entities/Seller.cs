using System;
using System.Collections.Generic;

namespace Marketplace.Core.Entities;

public enum SellerStatus
{
    PendingApproval = 0,
    Approved = 1,
    Rejected = 2,
    Locked = 3
}

public class Seller
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ShopName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; } = false;
    public SellerStatus Status { get; set; } = SellerStatus.PendingApproval;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ApplicationUser? User { get; set; }
    public SellerWallet? Wallet { get; set; }
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
