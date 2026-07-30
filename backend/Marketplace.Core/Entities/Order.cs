namespace Marketplace.Core.Entities;

public enum OrderStatus
{
    Pending = 0,        // Chờ xử lý
    Processing = 1,     // Đang xử lý
    Shipping = 2,       // Đang giao
    Delivered = 3,      // Đã giao
    Cancelled = 4       // Đã hủy
}

public class Order
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string AddressSnapshot { get; set; } = string.Empty; // JSON snapshot of address at order time
    public decimal TotalAmount { get; set; }
    public string PaymentMethod { get; set; } = "COD"; // COD, VNPay, Momo
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ApplicationUser? User { get; set; }
    public ICollection<SubOrder> SubOrders { get; set; } = new List<SubOrder>();
}

public class SubOrder
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int SellerId { get; set; }
    public decimal SubTotal { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Order? Order { get; set; }
    public Seller? Seller { get; set; }
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public ICollection<OrderStatusHistory> StatusHistories { get; set; } = new List<OrderStatusHistory>();
}

public class OrderItem
{
    public int Id { get; set; }
    public int SubOrderId { get; set; }
    public int ProductSkuId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty; // Snapshot
    public string? SkuInfo { get; set; } // e.g. "L / Đen"
    public decimal PriceSnapshot { get; set; }
    public int Quantity { get; set; }
    public string? ImageUrl { get; set; }

    public SubOrder? SubOrder { get; set; }
    public ProductSku? ProductSku { get; set; }
    public Product? Product { get; set; }
}

public class OrderStatusHistory
{
    public int Id { get; set; }
    public int SubOrderId { get; set; }
    public OrderStatus FromStatus { get; set; }
    public OrderStatus ToStatus { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public SubOrder? SubOrder { get; set; }
}
