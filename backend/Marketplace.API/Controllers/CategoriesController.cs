using Marketplace.Core.Entities;
using Marketplace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Marketplace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CategoriesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _context.Categories
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Description,
                c.ParentCategoryId
            })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("tree")]
    public async Task<IActionResult> GetTree()
    {
        var rootCategories = await _context.Categories
            .Where(c => c.ParentCategoryId == null)
            .Select(c => new CategoryTreeDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Children = c.ChildCategories.Select(cc => new CategoryTreeDto
                {
                    Id = cc.Id,
                    Name = cc.Name,
                    Description = cc.Description,
                    Children = cc.ChildCategories.Select(ccc => new CategoryTreeDto
                    {
                        Id = ccc.Id,
                        Name = ccc.Name,
                        Description = ccc.Description
                    }).ToList()
                }).ToList()
            })
            .ToListAsync();

        return Ok(rootCategories);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var category = await _context.Categories
            .Where(c => c.Id == id)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Description,
                c.ParentCategoryId
            })
            .FirstOrDefaultAsync();

        if (category == null) return NotFound(new { message = "Không tìm thấy danh mục." });

        return Ok(category);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CategoryCreateDto dto)
    {
        if (dto.ParentCategoryId.HasValue)
        {
            var parentExists = await _context.Categories.AnyAsync(c => c.Id == dto.ParentCategoryId.Value);
            if (!parentExists)
                return BadRequest(new { message = "Danh mục cha không tồn tại." });
        }

        var category = new Category
        {
            Name = dto.Name,
            Description = dto.Description ?? string.Empty,
            ParentCategoryId = dto.ParentCategoryId
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CategoryUpdateDto dto)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return NotFound(new { message = "Không tìm thấy danh mục." });

        if (dto.ParentCategoryId.HasValue)
        {
            if (dto.ParentCategoryId.Value == id)
                return BadRequest(new { message = "Danh mục cha không thể là chính nó." });

            var parentExists = await _context.Categories.AnyAsync(c => c.Id == dto.ParentCategoryId.Value);
            if (!parentExists)
                return BadRequest(new { message = "Danh mục cha không tồn tại." });
        }

        category.Name = dto.Name;
        category.Description = dto.Description ?? string.Empty;
        category.ParentCategoryId = dto.ParentCategoryId;

        await _context.SaveChangesAsync();
        return Ok(category);
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return NotFound(new { message = "Không tìm thấy danh mục." });

        // Check if there are child categories
        var hasChildren = await _context.Categories.AnyAsync(c => c.ParentCategoryId == id);
        if (hasChildren)
            return BadRequest(new { message = "Không thể xóa danh mục đang có danh mục con." });

        // Check if there are products in this category
        var hasProducts = await _context.Products.AnyAsync(p => p.CategoryId == id);
        if (hasProducts)
            return BadRequest(new { message = "Không thể xóa danh mục đang chứa sản phẩm." });

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Xóa danh mục thành công." });
    }
}

public class CategoryCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ParentCategoryId { get; set; }
}

public class CategoryUpdateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ParentCategoryId { get; set; }
}

public class CategoryTreeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<CategoryTreeDto> Children { get; set; } = new();
}
