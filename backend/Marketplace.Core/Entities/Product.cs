using System;
using System.Collections.Generic;

namespace Marketplace.Core.Entities;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public int SellerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Category? Category { get; set; }
    public Seller? Seller { get; set; }
    public ICollection<ProductSku> Skus { get; set; } = new List<ProductSku>();
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
}
