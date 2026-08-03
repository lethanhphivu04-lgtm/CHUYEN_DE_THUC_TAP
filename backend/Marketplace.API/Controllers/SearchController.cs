using Marketplace.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Marketplace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SearchController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SearchController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>Gợi ý tìm kiếm nhanh (Autocomplete)</summary>
    [HttpGet("autocomplete")]
    public async Task<IActionResult> Autocomplete([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
        {
            return Ok(new { products = new List<object>(), categories = new List<object>() });
        }

        string keyword = q.Trim().ToLower();

        var products = await _context.Products
            .Where(p => p.Name.ToLower().Contains(keyword))
            .Take(5)
            .Select(p => new
            {
                p.Id,
                p.Name,
                MainImage = p.Images.FirstOrDefault(i => i.IsMain) != null ? p.Images.FirstOrDefault(i => i.IsMain)!.ImageUrl : p.Images.FirstOrDefault()!.ImageUrl,
                MinPrice = p.Skus.Any() ? p.Skus.Min(s => s.Price) : 0
            })
            .ToListAsync();

        var categories = await _context.Categories
            .Where(c => c.Name.ToLower().Contains(keyword))
            .Take(3)
            .Select(c => new
            {
                c.Id,
                c.Name
            })
            .ToListAsync();

        return Ok(new
        {
            products,
            categories
        });
    }
}
