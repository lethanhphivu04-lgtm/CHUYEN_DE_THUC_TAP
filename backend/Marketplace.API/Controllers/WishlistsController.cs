using System.Security.Claims;
using Marketplace.Core.Entities;
using Marketplace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Marketplace.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WishlistsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public WishlistsController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>Lấy danh sách sản phẩm yêu thích của tôi</summary>
    [HttpGet]
    public async Task<IActionResult> GetMyWishlist()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var items = await _context.Wishlists
            .Where(w => w.UserId == userId)
            .Include(w => w.Product)
                .ThenInclude(p => p!.Images)
            .Include(w => w.Product)
                .ThenInclude(p => p!.Skus)
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new
            {
                w.Id,
                w.ProductId,
                ProductName = w.Product != null ? w.Product.Name : "",
                MainImage = w.Product != null ? (w.Product.Images.FirstOrDefault(i => i.IsMain) != null ? w.Product.Images.FirstOrDefault(i => i.IsMain)!.ImageUrl : w.Product.Images.FirstOrDefault()!.ImageUrl) : null,
                MinPrice = w.Product != null && w.Product.Skus.Any() ? w.Product.Skus.Min(s => s.Price) : 0,
                w.CreatedAt
            })
            .ToListAsync();

        return Ok(items);
    }

    /// <summary>Thêm / Xóa sản phẩm khỏi danh sách yêu thích</summary>
    [HttpPost("toggle/{productId}")]
    public async Task<IActionResult> ToggleWishlist(int productId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var existing = await _context.Wishlists
            .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);

        if (existing != null)
        {
            _context.Wishlists.Remove(existing);
            await _context.SaveChangesAsync();
            return Ok(new { isFavorited = false, message = "Đã bỏ sản phẩm khỏi danh sách yêu thích." });
        }
        else
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return NotFound(new { message = "Không tìm thấy sản phẩm." });

            var wishlist = new Wishlist
            {
                UserId = userId,
                ProductId = productId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Wishlists.Add(wishlist);
            await _context.SaveChangesAsync();
            return Ok(new { isFavorited = true, message = "Đã thêm sản phẩm vào danh sách yêu thích!" });
        }
    }
}
