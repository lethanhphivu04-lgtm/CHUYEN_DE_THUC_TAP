using System.Security.Claims;
using System.Text.Json;
using Marketplace.Core.Entities;
using Marketplace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Marketplace.API.Controllers;

/// <summary>
/// API Quản lý Đặt hàng và Đơn hàng (Checkout tách đơn tự động theo Seller, Lịch sử mua hàng, Hủy đơn)
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public OrdersController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>Checkout: tách đơn theo seller, snapshot giá/địa chỉ, trừ tồn kho</summary>
    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        // 1. Validate address
        var address = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == dto.AddressId && a.UserId == userId);
        if (address == null) return BadRequest(new { message = "Địa chỉ giao hàng không hợp lệ." });

        // 2. Get cart items
        var cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId);
        if (cart == null) return BadRequest(new { message = "Giỏ hàng trống." });

        var cartItems = await _context.CartItems
            .Where(ci => ci.CartId == cart.Id)
            .Include(ci => ci.ProductSku)
                .ThenInclude(ps => ps!.Product)
                    .ThenInclude(p => p!.Images)
            .Include(ci => ci.ProductSku)
                .ThenInclude(ps => ps!.Product)
                    .ThenInclude(p => p!.Seller)
            .ToListAsync();

        if (cartItems.Count == 0) return BadRequest(new { message = "Giỏ hàng trống." });

        // 3. Validate stock
        foreach (var ci in cartItems)
        {
            if (ci.ProductSku == null) return BadRequest(new { message = "SKU không hợp lệ." });
            if (ci.ProductSku.StockQuantity < ci.Quantity)
                return BadRequest(new { message = $"Sản phẩm \"{ci.ProductSku.Product?.Name}\" không đủ tồn kho. Còn lại: {ci.ProductSku.StockQuantity}" });
        }

        // 4. Group by seller → create SubOrders
        var addressSnapshot = JsonSerializer.Serialize(new { address.ReceiverName, address.Phone, address.StreetAddress, address.Ward, address.District, address.City });

        var order = new Order
        {
            UserId = userId,
            AddressSnapshot = addressSnapshot,
            PaymentMethod = dto.PaymentMethod ?? "COD",
            CreatedAt = DateTime.UtcNow
        };

        var grouped = cartItems.GroupBy(ci => ci.ProductSku!.Product!.SellerId);
        decimal totalAmount = 0;

        foreach (var sellerGroup in grouped)
        {
            var subOrder = new SubOrder
            {
                SellerId = sellerGroup.Key,
                Status = OrderStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            decimal subTotal = 0;
            foreach (var ci in sellerGroup)
            {
                var sku = ci.ProductSku!;
                var product = sku.Product!;
                var mainImage = product.Images.FirstOrDefault(i => i.IsMain)?.ImageUrl
                    ?? product.Images.FirstOrDefault()?.ImageUrl;
                var skuInfo = string.Join(" / ", new[] { sku.Size, sku.Color }.Where(s => !string.IsNullOrEmpty(s)));

                subOrder.Items.Add(new OrderItem
                {
                    ProductSkuId = sku.Id,
                    ProductId = product.Id,
                    ProductName = product.Name,
                    SkuInfo = skuInfo,
                    PriceSnapshot = sku.Price,
                    Quantity = ci.Quantity,
                    ImageUrl = mainImage
                });

                subTotal += sku.Price * ci.Quantity;

                // Deduct stock
                sku.StockQuantity -= ci.Quantity;
            }

            subOrder.SubTotal = subTotal;
            subOrder.StatusHistories.Add(new OrderStatusHistory
            {
                FromStatus = OrderStatus.Pending,
                ToStatus = OrderStatus.Pending,
                Note = "Đơn hàng được tạo"
            });

            order.SubOrders.Add(subOrder);
            totalAmount += subTotal;
        }

        // 4.5 Apply voucher if present
        if (!string.IsNullOrEmpty(dto.VoucherCode))
        {
            var now = DateTime.UtcNow;
            var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == dto.VoucherCode.ToUpper() && v.IsActive);
            if (voucher == null || voucher.StartDate > now || voucher.ExpiryDate < now)
                return BadRequest(new { message = "Mã giảm giá không tồn tại hoặc đã hết hạn." });

            if (voucher.UsedCount >= voucher.UsageLimit)
                return BadRequest(new { message = "Mã giảm giá đã hết lượt sử dụng." });

            if (totalAmount < voucher.MinOrderAmount)
                return BadRequest(new { message = $"Đơn hàng tối thiểu phải từ {voucher.MinOrderAmount:N0}đ để dùng mã này." });

            decimal discount = 0;
            if (voucher.DiscountAmount.HasValue && voucher.DiscountAmount > 0)
            {
                discount = voucher.DiscountAmount.Value;
            }
            else if (voucher.DiscountPercent.HasValue && voucher.DiscountPercent > 0)
            {
                discount = totalAmount * (voucher.DiscountPercent.Value / 100m);
                if (voucher.MaxDiscountAmount.HasValue && discount > voucher.MaxDiscountAmount.Value)
                {
                    discount = voucher.MaxDiscountAmount.Value;
                }
            }

            totalAmount = Math.Max(0, totalAmount - discount);
            voucher.UsedCount += 1;
        }

        order.TotalAmount = totalAmount;

        // 5. Save order + clear cart
        _context.Orders.Add(order);
        _context.CartItems.RemoveRange(cartItems);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đặt hàng thành công!", orderId = order.Id });
    }

    /// <summary>
    /// Lấy danh sách lịch sử đơn hàng của người dùng đang đăng nhập
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMyOrders()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var orders = await _context.Orders
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new
            {
                o.Id,
                o.TotalAmount,
                o.PaymentMethod,
                o.CreatedAt,
                SubOrders = o.SubOrders.Select(so => new
                {
                    so.Id,
                    so.SellerId,
                    ShopName = so.Seller != null ? so.Seller.ShopName : "",
                    so.SubTotal,
                    Status = so.Status.ToString(),
                    so.CreatedAt,
                    Items = so.Items.Select(oi => new
                    {
                        oi.Id,
                        oi.ProductName,
                        oi.SkuInfo,
                        oi.PriceSnapshot,
                        oi.Quantity,
                        oi.ImageUrl
                    }).ToList()
                }).ToList()
            })
            .ToListAsync();

        return Ok(orders);
    }

    /// <summary>Chi tiết một đơn hàng</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrder(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var order = await _context.Orders
            .Where(o => o.Id == id && o.UserId == userId)
            .Select(o => new
            {
                o.Id,
                o.TotalAmount,
                o.PaymentMethod,
                o.AddressSnapshot,
                o.CreatedAt,
                SubOrders = o.SubOrders.Select(so => new
                {
                    so.Id,
                    so.SellerId,
                    ShopName = so.Seller != null ? so.Seller.ShopName : "",
                    so.SubTotal,
                    Status = so.Status.ToString(),
                    so.CreatedAt,
                    Items = so.Items.Select(oi => new
                    {
                        oi.Id,
                        oi.ProductName,
                        oi.SkuInfo,
                        oi.PriceSnapshot,
                        oi.Quantity,
                        oi.ImageUrl
                    }).ToList(),
                    StatusHistories = so.StatusHistories.OrderBy(h => h.CreatedAt).Select(h => new
                    {
                        From = h.FromStatus.ToString(),
                        To = h.ToStatus.ToString(),
                        h.Note,
                        h.CreatedAt
                    }).ToList()
                }).ToList()
            })
            .FirstOrDefaultAsync();

        if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });
        return Ok(order);
    }

    /// <summary>Khách hủy đơn (chỉ khi Pending)</summary>
    [HttpPost("{subOrderId}/cancel")]
    public async Task<IActionResult> CancelSubOrder(int subOrderId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var subOrder = await _context.SubOrders
            .Include(so => so.Order)
            .Include(so => so.Items)
            .FirstOrDefaultAsync(so => so.Id == subOrderId && so.Order!.UserId == userId);

        if (subOrder == null) return NotFound(new { message = "Không tìm thấy đơn hàng con." });
        if (subOrder.Status != OrderStatus.Pending)
            return BadRequest(new { message = "Chỉ có thể hủy đơn đang chờ xử lý." });

        subOrder.Status = OrderStatus.Cancelled;
        subOrder.UpdatedAt = DateTime.UtcNow;
        subOrder.StatusHistories.Add(new OrderStatusHistory
        {
            FromStatus = OrderStatus.Pending,
            ToStatus = OrderStatus.Cancelled,
            Note = "Khách hàng hủy đơn"
        });

        // Restore stock
        foreach (var item in subOrder.Items)
        {
            var sku = await _context.ProductSkus.FindAsync(item.ProductSkuId);
            if (sku != null) sku.StockQuantity += item.Quantity;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Đã hủy đơn hàng." });
    }

    /// <summary>Seller cập nhật trạng thái (chỉ tiến, không lùi)</summary>
    [HttpPost("{subOrderId}/status")]
    public async Task<IActionResult> UpdateStatus(int subOrderId, [FromBody] UpdateStatusDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        var isAdmin = User.IsInRole("Admin");

        var subOrder = await _context.SubOrders.FindAsync(subOrderId);
        if (subOrder == null) return NotFound(new { message = "Không tìm thấy đơn hàng con." });

        if (!isAdmin && (seller == null || subOrder.SellerId != seller.Id))
            return Forbid();

        if (!Enum.TryParse<OrderStatus>(dto.NewStatus, out var newStatus))
            return BadRequest(new { message = "Trạng thái không hợp lệ." });

        // No backward transitions (except Cancelled from Pending)
        if (newStatus != OrderStatus.Cancelled && (int)newStatus <= (int)subOrder.Status)
            return BadRequest(new { message = "Không thể chuyển trạng thái lùi." });

        if (newStatus == OrderStatus.Cancelled && subOrder.Status != OrderStatus.Pending)
            return BadRequest(new { message = "Chỉ có thể hủy đơn đang chờ xử lý." });

        var oldStatus = subOrder.Status;
        subOrder.Status = newStatus;
        subOrder.UpdatedAt = DateTime.UtcNow;

        _context.OrderStatusHistories.Add(new OrderStatusHistory
        {
            SubOrderId = subOrderId,
            FromStatus = oldStatus,
            ToStatus = newStatus,
            Note = dto.Note
        });

        // Restore stock on cancel
        if (newStatus == OrderStatus.Cancelled)
        {
            var items = await _context.OrderItems.Where(oi => oi.SubOrderId == subOrderId).ToListAsync();
            foreach (var item in items)
            {
                var sku = await _context.ProductSkus.FindAsync(item.ProductSkuId);
                if (sku != null) sku.StockQuantity += item.Quantity;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Cập nhật trạng thái thành công." });
    }
}

public class CheckoutDto
{
    public int AddressId { get; set; }
    public string? PaymentMethod { get; set; }
    public string? VoucherCode { get; set; }
}

public class UpdateStatusDto
{
    public string NewStatus { get; set; } = string.Empty;
    public string? Note { get; set; }
}
