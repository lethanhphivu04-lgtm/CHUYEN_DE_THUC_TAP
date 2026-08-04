using Marketplace.Core.Entities;
using Marketplace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Marketplace.API.Controllers;

/// <summary>
/// API Quản lý Đơn hàng dành riêng cho Admin (Xem tất cả đơn hàng, tìm kiếm đơn hàng)
/// </summary>
[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/orders")]
public class AdminOrdersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminOrdersController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>[Admin] Lấy danh sách tất cả các đơn hàng lớn và đơn hàng con trên sàn</summary>
    [HttpGet]
    public async Task<IActionResult> GetAllOrders([FromQuery] string? search)
    {
        var query = _context.Orders.AsQueryable();

        // Tìm kiếm theo Mã đơn hàng hoặc Tên/Email khách hàng
        if (!string.IsNullOrEmpty(search))
        {
            if (int.TryParse(search, out var orderId))
            {
                query = query.Where(o => o.Id == orderId);
            }
            else
            {
                query = query.Where(o => o.User != null && 
                    (o.User.FullName.Contains(search) || o.User.Email!.Contains(search)));
            }
        }

        var orders = await query
            .Include(o => o.User)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new
            {
                o.Id,
                o.TotalAmount,
                o.PaymentMethod,
                o.CreatedAt,
                CustomerName = o.User != null ? o.User.FullName : "Khách hàng",
                CustomerEmail = o.User != null ? o.User.Email : "",
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
            .ToListAsync();

        return Ok(orders);
    }
}
