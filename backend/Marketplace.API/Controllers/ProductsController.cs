using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Marketplace.Core.Entities;
using Marketplace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Marketplace.API.Controllers;

/// <summary>
/// API Quản lý Sản phẩm (Danh sách, Chi tiết, Thêm mới, Xóa sản phẩm)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProductsController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách sản phẩm (có hỗ trợ Lọc theo Từ khóa, Danh mục, Khoảng giá, Sắp xếp và Phân trang)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? search,
        [FromQuery] int? categoryId,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] string? sortBy,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Seller)
            .Include(p => p.Skus)
            .Include(p => p.Images)
            .AsQueryable();

        // Filtering
        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(searchLower) || 
                                     p.Description.ToLower().Contains(searchLower));
        }

        if (categoryId.HasValue)
        {
            // Include child categories if any
            var childCategoryIds = await _context.Categories
                .Where(c => c.ParentCategoryId == categoryId.Value)
                .Select(c => c.Id)
                .ToListAsync();

            childCategoryIds.Add(categoryId.Value);

            query = query.Where(p => childCategoryIds.Contains(p.CategoryId));
        }

        if (minPrice.HasValue)
        {
            query = query.Where(p => p.Skus.Any(s => s.Price >= minPrice.Value));
        }

        if (maxPrice.HasValue)
        {
            query = query.Where(p => p.Skus.Any(s => s.Price <= maxPrice.Value));
        }

        // Sorting
        query = sortBy switch
        {
            "price-asc" => query.OrderBy(p => p.Skus.Min(s => s.Price)),
            "price-desc" => query.OrderByDescending(p => p.Skus.Min(s => s.Price)),
            "date-desc" => query.OrderByDescending(p => p.CreatedAt),
            _ => query.OrderByDescending(p => p.CreatedAt) // default
        };

        // Pagination
        var totalItems = await query.CountAsync();
        var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

        var products = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                CategoryId = p.CategoryId,
                CategoryName = p.Category != null ? p.Category.Name : string.Empty,
                SellerId = p.SellerId,
                ShopName = p.Seller != null ? p.Seller.ShopName : string.Empty,
                MainImageUrl = p.Images.FirstOrDefault(i => i.IsMain) != null 
                    ? p.Images.FirstOrDefault(i => i.IsMain)!.ImageUrl 
                    : (p.Images.FirstOrDefault() != null ? p.Images.FirstOrDefault()!.ImageUrl : string.Empty),
                MinPrice = p.Skus.Any() ? p.Skus.Min(s => s.Price) : 0,
                MaxPrice = p.Skus.Any() ? p.Skus.Max(s => s.Price) : 0,
                StockQuantity = p.Skus.Sum(s => s.StockQuantity)
            })
            .ToListAsync();

        return Ok(new
        {
            products,
            page,
            pageSize,
            totalItems,
            totalPages
        });
    }

    /// <summary>
    /// Lấy chi tiết thông tin 1 sản phẩm theo ID (gồm danh sách SKU và hình ảnh)
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProductById(int id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Seller)
            .Include(p => p.Skus)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null) return NotFound(new { message = "Không tìm thấy sản phẩm." });

        var dto = new ProductDetailDto
        {
            Id = product.Id,
            Name = product.Name,
            Description = product.Description,
            CategoryId = product.CategoryId,
            CategoryName = product.Category != null ? product.Category.Name : string.Empty,
            SellerId = product.SellerId,
            ShopName = product.Seller != null ? product.Seller.ShopName : string.Empty,
            Images = product.Images.Select(i => new ProductImageDto
            {
                Id = i.Id,
                ImageUrl = i.ImageUrl,
                IsMain = i.IsMain
            }).ToList(),
            Skus = product.Skus.Select(s => new ProductSkuDto
            {
                Id = s.Id,
                SkuCode = s.SkuCode,
                Price = s.Price,
                StockQuantity = s.StockQuantity,
                Size = s.Size,
                Color = s.Color
            }).ToList(),
            CreatedAt = product.CreatedAt
        };

        return Ok(dto);
    }

    /// <summary>
    /// Đăng bán sản phẩm mới (Dành cho Người bán / Seller)
    /// </summary>
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] ProductCreateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        // 1. Get or Create Seller for this user
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null)
        {
            var user = await _context.Users.FindAsync(userId);
            seller = new Seller
            {
                UserId = userId,
                ShopName = user != null ? $"Shop của {user.FullName}" : "Gian Hàng Mới",
                Description = "Gian hàng của tôi trên HITU MARKET",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Sellers.Add(seller);
            await _context.SaveChangesAsync();
        }

        // 2. Validate category
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId);
        if (!categoryExists)
            return BadRequest(new { message = "Danh mục sản phẩm không tồn tại." });

        // 3. Create Product
        var product = new Product
        {
            Name = dto.Name,
            Description = dto.Description,
            CategoryId = dto.CategoryId,
            SellerId = seller.Id,
            CreatedAt = DateTime.UtcNow
        };

        // Add SKUs
        if (dto.Skus == null || !dto.Skus.Any())
        {
            // Add a default SKU if none is provided
            product.Skus.Add(new ProductSku
            {
                SkuCode = $"{dto.Name.Replace(" ", "-").ToUpper()}-DEF",
                Price = dto.DefaultPrice,
                StockQuantity = dto.DefaultStock,
                Size = "Standard",
                Color = "Default"
            });
        }
        else
        {
            foreach (var sku in dto.Skus)
            {
                product.Skus.Add(new ProductSku
                {
                    SkuCode = sku.SkuCode,
                    Price = sku.Price,
                    StockQuantity = sku.StockQuantity,
                    Size = sku.Size,
                    Color = sku.Color
                });
            }
        }

        // Add Images
        if (dto.Images != null && dto.Images.Any())
        {
            bool hasMain = false;
            foreach (var img in dto.Images)
            {
                product.Images.Add(new ProductImage
                {
                    ImageUrl = img.ImageUrl,
                    IsMain = img.IsMain
                });
                if (img.IsMain) hasMain = true;
            }
            // If no image is marked main, make the first one main
            if (!hasMain && product.Images.Any())
            {
                product.Images.First().IsMain = true;
            }
        }
        else
        {
            // Default placeholder image
            product.Images.Add(new ProductImage
            {
                ImageUrl = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600&auto=format&fit=crop",
                IsMain = true
            });
        }

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProductById), new { id = product.Id }, product);
    }

    /// <summary>
    /// Xóa sản phẩm theo ID (Yêu cầu quyền Seller sở hữu hoặc Admin)
    /// </summary>
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound(new { message = "Không tìm thấy sản phẩm." });

        // Check if the user is the seller of the product or an admin
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && (seller == null || product.SellerId != seller.Id))
        {
            return Forbid();
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Xóa sản phẩm thành công." });
    }
}

public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int SellerId { get; set; }
    public string ShopName { get; set; } = string.Empty;
    public string MainImageUrl { get; set; } = string.Empty;
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
    public int StockQuantity { get; set; }
}

public class ProductDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int SellerId { get; set; }
    public string ShopName { get; set; } = string.Empty;
    public List<ProductImageDto> Images { get; set; } = new();
    public List<ProductSkuDto> Skus { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class ProductImageDto
{
    public int Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsMain { get; set; }
}

public class ProductSkuDto
{
    public int Id { get; set; }
    public string SkuCode { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }
}

public class ProductCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public decimal DefaultPrice { get; set; }
    public int DefaultStock { get; set; }
    public List<ProductSkuCreateDto>? Skus { get; set; }
    public List<ProductImageCreateDto>? Images { get; set; }
}

public class ProductSkuCreateDto
{
    public string SkuCode { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }
}

public class ProductImageCreateDto
{
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsMain { get; set; }
}
