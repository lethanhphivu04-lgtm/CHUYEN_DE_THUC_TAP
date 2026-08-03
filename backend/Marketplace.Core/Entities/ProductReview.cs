using System;

namespace Marketplace.Core.Entities;

public class ProductReview
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int SubOrderId { get; set; }
    public int Rating { get; set; } = 5; // 1 to 5 stars
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Product? Product { get; set; }
    public ApplicationUser? User { get; set; }
    public SubOrder? SubOrder { get; set; }
}
