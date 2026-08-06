using Marketplace.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Marketplace.API.Controllers;

/// <summary>
/// Controller xử lý các yêu cầu tìm kiếm và gợi ý nhanh (Autocomplete) cho người dùng
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SearchController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SearchController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gợi ý tìm kiếm nhanh theo từ khóa (Autocomplete)
    /// Trả về tối đa 5 sản phẩm và 3 danh mục phù hợp
    /// </summary>
    /// <param name="q">Từ khóa tìm kiếm do người dùng nhập</param>
    [HttpGet("autocomplete")]
    public async Task<IActionResult> Autocomplete([FromQuery] string q)
    {
        // 1. Kiểm tra từ khóa: Nếu rỗng hoặc ngắn hơn 2 ký tự thì trả về danh sách rỗng để tiết kiệm tài nguyên
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
        {
            return Ok(new { products = new List<object>(), categories = new List<object>() });
        }

        // Chuyển từ khóa về dạng chữ thường và cắt bỏ khoảng trắng thừa 2 đầu
        string keyword = q.Trim().ToLower();

        // 2. Lọc tối đa 5 sản phẩm có tên chứa từ khóa tìm kiếm
        var products = await _context.Products
            .Where(p => p.Name.ToLower().Contains(keyword))
            .Take(5) // Chỉ lấy tối đa 5 gợi ý sản phẩm
            .Select(p => new
            {
                p.Id,
                p.Name,
                // Lấy ảnh chính (IsMain), nếu không có ảnh chính thì lấy ảnh đầu tiên
                MainImage = p.Images.FirstOrDefault(i => i.IsMain) != null 
                    ? p.Images.FirstOrDefault(i => i.IsMain)!.ImageUrl 
                    : p.Images.FirstOrDefault()!.ImageUrl,
                // Lấy giá thấp nhất trong các phiên bản (SKU) của sản phẩm
                MinPrice = p.Skus.Any() ? p.Skus.Min(s => s.Price) : 0
            })
            .ToListAsync();

        // 3. Lọc tối đa 3 danh mục có tên chứa từ khóa tìm kiếm
        var categories = await _context.Categories
            .Where(c => c.Name.ToLower().Contains(keyword))
            .Take(3) // Chỉ lấy tối đa 3 gợi ý danh mục
            .Select(c => new
            {
                c.Id,
                c.Name
            })
            .ToListAsync();

        // 4. Trả về kết quả JSON gồm 2 danh sách sản phẩm và danh mục gợi ý
        return Ok(new
        {
            products,
            categories
        });
    }
}
