using System.Security.Claims;
using Marketplace.Core.Entities;
using Marketplace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Marketplace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductReviewsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProductReviewsController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>Lấy danh sách Đánh giá & Điểm trung bình của Sản phẩm</summary>
    [HttpGet("product/{productId}")]
    public async Task<IActionResult> GetProductReviews(int productId)
    {
        var reviews = await _context.ProductReviews
            .Where(r => r.ProductId == productId)
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.Rating,
                r.Comment,
                r.CreatedAt,
                UserFullName = r.User != null ? r.User.FullName : "Khách hàng"
            })
            .ToListAsync();

        double averageRating = reviews.Count > 0 ? reviews.Average(r => r.Rating) : 5.0;

        return Ok(new
        {
            totalReviews = reviews.Count,
            averageRating = Math.Round(averageRating, 1),
            reviews
        });
    }

    /// <summary>Viết đánh giá cho sản phẩm đã mua</summary>
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        // Check if user has bought this suborder & delivered
        var subOrder = await _context.SubOrders
            .Include(so => so.Order)
            .Include(so => so.Items)
            .FirstOrDefaultAsync(so => so.Id == dto.SubOrderId && so.Order!.UserId == userId);

        if (subOrder == null || subOrder.Status != OrderStatus.Delivered)
        {
            return BadRequest(new { message = "Chỉ có thể đánh giá sản phẩm sau khi đơn hàng được giao thành công." });
        }

        var hasProductInSubOrder = subOrder.Items.Any(i => i.ProductId == dto.ProductId);
        if (!hasProductInSubOrder)
        {
            return BadRequest(new { message = "Sản phẩm không thuộc đơn hàng này." });
        }

        var existingReview = await _context.ProductReviews
            .FirstOrDefaultAsync(r => r.SubOrderId == dto.SubOrderId && r.ProductId == dto.ProductId && r.UserId == userId);

        if (existingReview != null)
        {
            return BadRequest(new { message = "Bạn đã gửi đánh giá cho sản phẩm trong đơn hàng này trước đó." });
        }

        var review = new ProductReview
        {
            ProductId = dto.ProductId,
            UserId = userId,
            SubOrderId = dto.SubOrderId,
            Rating = Math.Clamp(dto.Rating, 1, 5),
            Comment = dto.Comment,
            CreatedAt = DateTime.UtcNow
        };

        _context.ProductReviews.Add(review);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Gửi đánh giá thành công! Cảm ơn ý kiến của bạn." });
    }
}

public class CreateReviewDto
{
    public int ProductId { get; set; }
    public int SubOrderId { get; set; }
    public int Rating { get; set; } = 5;
    public string Comment { get; set; } = string.Empty;
}
