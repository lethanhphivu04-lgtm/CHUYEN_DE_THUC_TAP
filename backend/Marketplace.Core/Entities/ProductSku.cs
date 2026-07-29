namespace Marketplace.Core.Entities;

public class ProductSku
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string SkuCode { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }

    public Product? Product { get; set; }
}
