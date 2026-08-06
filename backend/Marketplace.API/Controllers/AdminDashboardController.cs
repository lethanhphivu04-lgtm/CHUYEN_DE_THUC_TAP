using Marketplace.Core.Entities;
using Marketplace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Marketplace.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public DashboardController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    /// <summary>[Admin] Thống kê Realtime toàn bộ sàn thương mại điện tử</summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetSystemStats()
    {
        var totalUsers = await _userManager.Users.CountAsync();
        var totalSellers = await _context.Sellers.CountAsync(s => s.Status == SellerStatus.Approved);
        var pendingSellers = await _context.Sellers.CountAsync(s => s.Status == SellerStatus.PendingApproval);
        var totalProducts = await _context.Products.CountAsync();
        var totalOrders = await _context.Orders.CountAsync();

        var totalRevenue = await _context.SubOrders
            .Where(so => so.Status == OrderStatus.Delivered)
            .SumAsync(so => (decimal?)so.SubTotal) ?? 0m;

        var recentOrders = await _context.Orders
            .Include(o => o.User)
            .OrderByDescending(o => o.CreatedAt)
            .Take(5)
            .Select(o => new
            {
                o.Id,
                CustomerName = o.User != null ? o.User.FullName : "Khách hàng",
                o.TotalAmount,
                o.PaymentMethod,
                o.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            totalRevenue,
            totalUsers,
            totalSellers,
            pendingSellers,
            totalProducts,
            totalOrders,
            recentOrders
        });
    }
}
