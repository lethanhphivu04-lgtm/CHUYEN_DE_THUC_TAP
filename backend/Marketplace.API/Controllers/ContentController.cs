using Marketplace.Core.Entities;
using Marketplace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Marketplace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContentController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ContentController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>Lấy danh sách Banner đang hiển thị</summary>
    [HttpGet("banners")]
    public async Task<IActionResult> GetActiveBanners()
    {
        var banners = await _context.Banners
            .Where(b => b.IsActive)
            .OrderBy(b => b.DisplayOrder)
            .ThenByDescending(b => b.CreatedAt)
            .ToListAsync();

        return Ok(banners);
    }

    /// <summary>[Admin] Tạo Banner mới</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("banners")]
    public async Task<IActionResult> CreateBanner([FromBody] Banner dto)
    {
        _context.Banners.Add(dto);
        await _context.SaveChangesAsync();
        return Ok(dto);
    }

    /// <summary>Lấy danh sách Bài viết / Blog</summary>
    [HttpGet("posts")]
    public async Task<IActionResult> GetPosts()
    {
        var posts = await _context.Posts
            .Where(p => p.IsPublished)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(posts);
    }

    /// <summary>Chi tiết bài viết theo Slug hoặc ID</summary>
    [HttpGet("posts/{idOrSlug}")]
    public async Task<IActionResult> GetPost(string idOrSlug)
    {
        Post? post;
        if (int.TryParse(idOrSlug, out var id))
        {
            post = await _context.Posts.FindAsync(id);
        }
        else
        {
            post = await _context.Posts.FirstOrDefaultAsync(p => p.Slug == idOrSlug);
        }

        if (post == null) return NotFound(new { message = "Không tìm thấy bài viết." });

        return Ok(post);
    }

    /// <summary>[Admin] Tạo Bài viết mới</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("posts")]
    public async Task<IActionResult> CreatePost([FromBody] Post dto)
    {
        if (string.IsNullOrEmpty(dto.Slug))
        {
            dto.Slug = dto.Title.ToLower().Replace(" ", "-");
        }

        _context.Posts.Add(dto);
        await _context.SaveChangesAsync();
        return Ok(dto);
    }
}
