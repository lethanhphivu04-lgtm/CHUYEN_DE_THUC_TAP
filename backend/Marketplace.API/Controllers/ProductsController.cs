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
/// API Quản lý Sản phẩm (Danh sách, Chi tiết, Đăng bán sản phẩm, Cập nhật và Xóa sản phẩm)
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
    /// Lấy danh sách sản phẩm (Hỗ trợ Lọc từ khóa, Danh mục, Khoảng giá, Giảm giá, Còn hàng, Sắp xếp và Phân trang)
    /// </summary>
    /// <param name="search">Từ khóa tìm kiếm theo tên hoặc mô tả sản phẩm</param>
    /// <param name="categoryId">ID danh mục sản phẩm (Bao gồm cả danh mục con)</param>
    /// <param name="minPrice">Giá bán tối thiểu</param>
    /// <param name="maxPrice">Giá bán tối đa</param>
    /// <param name="sortBy">Tiêu chí sắp xếp: price-asc, price-desc, date-desc, hot, discount-desc</param>
    /// <param name="sellerId">ID gian hàng/người bán</param>
    /// <param name="isDiscounted">Chỉ lọc sản phẩm đang có chương trình giảm giá</param>
    /// <param name="onlyInStock">Chỉ lọc sản phẩm còn hàng trong kho</param>
    /// <param name="page">Trang hiện tại (Mặc định: 1)</param>
    /// <param name="pageSize">Số sản phẩm mỗi trang (Mặc định: 12)</param>
    [HttpGet]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? search,
        [FromQuery] int? categoryId,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] string? sortBy,
        [FromQuery] int? sellerId,
        [FromQuery] bool? isDiscounted,
        [FromQuery] bool? onlyInStock,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        // 1. Khởi tạo truy vấn danh sách sản phẩm và nạp các bảng liên kết (Category, Seller, Skus, Images)
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Seller)
            .Include(p => p.Skus)
            .Include(p => p.Images)
            .AsQueryable();

        // Lọc theo người bán (Seller)
        if (sellerId.HasValue)
        {
            query = query.Where(p => p.SellerId == sellerId.Value);
        }

        // Lọc theo từ khóa tìm kiếm (Tên hoặc Mô tả sản phẩm)
        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(searchLower) || 
                                     p.Description.ToLower().Contains(searchLower));
        }

        // Lọc theo danh mục sản phẩm (Bao gồm cả các danh mục con trực thuộc)
        if (categoryId.HasValue)
        {
            var childCategoryIds = await _context.Categories
                .Where(c => c.ParentCategoryId == categoryId.Value)
                .Select(c => c.Id)
                .ToListAsync();

            childCategoryIds.Add(categoryId.Value);

            query = query.Where(p => childCategoryIds.Contains(p.CategoryId));
        }

        // Lọc theo khoảng giá (Giá bán tối thiểu)
        if (minPrice.HasValue)
        {
            query = query.Where(p => p.Skus.Any(s => s.Price >= minPrice.Value));
        }

        // Lọc theo khoảng giá (Giá bán tối đa)
        if (maxPrice.HasValue)
        {
            query = query.Where(p => p.Skus.Any(s => s.Price <= maxPrice.Value));
        }

        // Lọc sản phẩm đang giảm giá (Giá gốc > Giá hiện tại và thời gian giảm giá chưa hết hạn)
        if (isDiscounted.HasValue && isDiscounted.Value)
        {
            var now = DateTime.UtcNow;
            query = query.Where(p => p.Skus.Any(s => s.OriginalPrice.HasValue && 
                                                     s.OriginalPrice.Value > s.Price && 
                                                     (!s.DiscountEndDate.HasValue || s.DiscountEndDate.Value > now)));
        }

        // Chỉ lấy sản phẩm còn hàng tồn trong kho
        if (onlyInStock.HasValue && onlyInStock.Value)
        {
            query = query.Where(p => p.Skus.Any(s => s.StockQuantity > 0));
        }

        // 2. Xử lý Sắp xếp sản phẩm (Price ASC/DESC, Date, Hot/Best-seller, Discount)
        query = sortBy switch
        {
            "price-asc" => query.OrderBy(p => p.Skus.Min(s => s.Price)),
            "price-desc" => query.OrderByDescending(p => p.Skus.Min(s => s.Price)),
            "date-desc" => query.OrderByDescending(p => p.CreatedAt),
            "hot" or "best-seller" => query.OrderByDescending(p => _context.OrderItems.Where(oi => oi.ProductId == p.Id).Sum(oi => (int?)oi.Quantity) ?? 0),
            "discount-desc" => query.OrderByDescending(p => p.Skus.Max(s => s.OriginalPrice.HasValue && s.OriginalPrice.Value > s.Price ? s.OriginalPrice.Value - s.Price : 0)),
            _ => query.OrderByDescending(p => p.CreatedAt) // Mặc định: Mới nhất xếp trước
        };

        // 3. Phân trang dữ liệu
        var totalItems = await query.CountAsync();
        var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

        var nowTime = DateTime.UtcNow;
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
                MinPrice = p.Skus.Any() 
                    ? p.Skus.Min(s => (s.DiscountEndDate.HasValue && nowTime > s.DiscountEndDate.Value) ? (s.OriginalPrice ?? s.Price) : s.Price) 
                    : 0,
                MaxPrice = p.Skus.Any() 
                    ? p.Skus.Max(s => (s.DiscountEndDate.HasValue && nowTime > s.DiscountEndDate.Value) ? (s.OriginalPrice ?? s.Price) : s.Price) 
                    : 0,
                MinOriginalPrice = p.Skus.Any(s => s.OriginalPrice.HasValue && (!s.DiscountEndDate.HasValue || s.DiscountEndDate.Value > nowTime)) 
                    ? p.Skus.Where(s => s.OriginalPrice.HasValue && (!s.DiscountEndDate.HasValue || s.DiscountEndDate.Value > nowTime)).Min(s => s.OriginalPrice) 
                    : null,
                MaxOriginalPrice = p.Skus.Any(s => s.OriginalPrice.HasValue && (!s.DiscountEndDate.HasValue || s.DiscountEndDate.Value > nowTime)) 
                    ? p.Skus.Where(s => s.OriginalPrice.HasValue && (!s.DiscountEndDate.HasValue || s.DiscountEndDate.Value > nowTime)).Max(s => s.OriginalPrice) 
                    : null,
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
    /// Lấy thông tin chi tiết của 1 sản phẩm theo ID (Gồm toàn bộ SKU phiên bản & Hình ảnh)
    /// </summary>
    /// <param name="id">Mã định danh sản phẩm</param>
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
            Skus = product.Skus.Select(s => {
                var now = DateTime.UtcNow;
                var isExpired = s.DiscountEndDate.HasValue && now > s.DiscountEndDate.Value;
                return new ProductSkuDto
                {
                    Id = s.Id,
                    SkuCode = s.SkuCode,
                    Price = isExpired ? (s.OriginalPrice ?? s.Price) : s.Price,
                    OriginalPrice = isExpired ? null : s.OriginalPrice,
                    DiscountEndDate = s.DiscountEndDate,
                    StockQuantity = s.StockQuantity,
                    Size = s.Size,
                    Color = s.Color
                };
            }).ToList(),
            CreatedAt = product.CreatedAt
        };

        return Ok(dto);
    }

    /// <summary>
    /// Đăng bán sản phẩm mới (Yêu cầu đăng nhập tài khoản Người bán / Seller)
    /// </summary>
    /// <param name="dto">Thông tin sản phẩm, danh sách SKU phiên bản và danh sách hình ảnh</param>
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] ProductCreateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        // 1. Kiểm tra hoặc Tự động tạo hồ sơ Gian hàng (Seller) cho người dùng nếu chưa có
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

        // 2. Kiểm tra sự tồn tại của danh mục sản phẩm
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId);
        if (!categoryExists)
            return BadRequest(new { message = "Danh mục sản phẩm không tồn tại." });

        // 3. Khởi tạo đối tượng Sản phẩm mới
        var product = new Product
        {
            Name = dto.Name,
            Description = dto.Description,
            CategoryId = dto.CategoryId,
            SellerId = seller.Id,
            CreatedAt = DateTime.UtcNow
        };

        // 4. Thêm danh sách phiên bản (SKU) cho sản phẩm
        if (dto.Skus == null || !dto.Skus.Any())
        {
            // Tạo SKU mặc định nếu không truyền danh sách SKU
            product.Skus.Add(new ProductSku
            {
                SkuCode = $"{dto.Name.Replace(" ", "-").ToUpper()}-DEF",
                Price = dto.DefaultPrice,
                OriginalPrice = dto.DefaultOriginalPrice,
                DiscountEndDate = dto.DefaultDiscountEndDate,
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
                    OriginalPrice = sku.OriginalPrice,
                    DiscountEndDate = sku.DiscountEndDate,
                    StockQuantity = sku.StockQuantity,
                    Size = sku.Size,
                    Color = sku.Color
                });
            }
        }

        // 5. Thêm danh sách hình ảnh sản phẩm
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
            // Đặt ảnh đầu tiên làm ảnh chính nếu chưa đánh dấu IsMain
            if (!hasMain && product.Images.Any())
            {
                product.Images.First().IsMain = true;
            }
        }
        else
        {
            // Sử dụng ảnh đại diện mặc định nếu không tải ảnh lên
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
    /// Cập nhật thông tin sản phẩm (Yêu cầu quyền chủ gian hàng hoặc Admin)
    /// </summary>
    /// <param name="id">Mã sản phẩm cần cập nhật</param>
    /// <param name="dto">Dữ liệu cập nhật sản phẩm</param>
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] ProductUpdateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var product = await _context.Products
            .Include(p => p.Skus)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null) return NotFound(new { message = "Không tìm thấy sản phẩm." });

        // Kiểm tra xem người dùng có phải là người bán sở hữu sản phẩm này hoặc là Admin không
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && (seller == null || product.SellerId != seller.Id))
        {
            return Forbid();
        }

        // Kiểm tra danh mục hợp lệ
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId);
        if (!categoryExists)
            return BadRequest(new { message = "Danh mục sản phẩm không tồn tại." });

        product.Name = dto.Name;
        product.Description = dto.Description;
        product.CategoryId = dto.CategoryId;
        product.UpdatedAt = DateTime.UtcNow;

        // Cập nhật thông tin SKU
        if (dto.Skus != null && dto.Skus.Any())
        {
            foreach (var skuDto in dto.Skus)
            {
                var existingSku = product.Skus.FirstOrDefault(s => s.Id == skuDto.Id);
                if (existingSku != null)
                {
                    existingSku.Price = skuDto.Price;
                    existingSku.OriginalPrice = skuDto.OriginalPrice;
                    existingSku.DiscountEndDate = skuDto.DiscountEndDate;
                    existingSku.StockQuantity = skuDto.StockQuantity;
                }
            }
        }
        else
        {
            // Cập nhật SKU mặc định nếu không truyền danh sách SKU
            var defaultSku = product.Skus.FirstOrDefault();
            if (defaultSku != null)
            {
                defaultSku.Price = dto.DefaultPrice;
                defaultSku.OriginalPrice = dto.DefaultOriginalPrice;
                defaultSku.DiscountEndDate = dto.DefaultDiscountEndDate;
                defaultSku.StockQuantity = dto.DefaultStock;
            }
            else
            {
                product.Skus.Add(new ProductSku
                {
                    SkuCode = $"{dto.Name.Replace(" ", "-").ToUpper()}-DEF",
                    Price = dto.DefaultPrice,
                    OriginalPrice = dto.DefaultOriginalPrice,
                    DiscountEndDate = dto.DefaultDiscountEndDate,
                    StockQuantity = dto.DefaultStock,
                    Size = "Standard",
                    Color = "Default"
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Cập nhật sản phẩm thành công." });
    }

    /// <summary>
    /// Xóa sản phẩm theo ID (Yêu cầu quyền chủ gian hàng hoặc Admin)
    /// </summary>
    /// <param name="id">Mã sản phẩm cần xóa</param>
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound(new { message = "Không tìm thấy sản phẩm." });

        // Kiểm tra xem người dùng có phải chủ sản phẩm hoặc Admin không
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

#region Data Transfer Objects (DTOs)
/// <summary> DTO chứa thông tin sản phẩm hiển thị trên danh sách </summary>
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
    public decimal? MinOriginalPrice { get; set; }
    public decimal? MaxOriginalPrice { get; set; }
    public int StockQuantity { get; set; }
}

/// <summary> DTO chứa thông tin chi tiết đầy đủ của sản phẩm </summary>
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

/// <summary> DTO hình ảnh sản phẩm </summary>
public class ProductImageDto
{
    public int Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsMain { get; set; }
}

/// <summary> DTO thông tin phiên bản sản phẩm (SKU) </summary>
public class ProductSkuDto
{
    public int Id { get; set; }
    public string SkuCode { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public DateTime? DiscountEndDate { get; set; }
    public int StockQuantity { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }
}

/// <summary> DTO dữ liệu tạo mới sản phẩm </summary>
public class ProductCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public decimal DefaultPrice { get; set; }
    public decimal? DefaultOriginalPrice { get; set; }
    public DateTime? DefaultDiscountEndDate { get; set; }
    public int DefaultStock { get; set; }
    public List<ProductSkuCreateDto>? Skus { get; set; }
    public List<ProductImageCreateDto>? Images { get; set; }
}

/// <summary> DTO tạo mới phiên bản sản phẩm (SKU) </summary>
public class ProductSkuCreateDto
{
    public string SkuCode { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public DateTime? DiscountEndDate { get; set; }
    public int StockQuantity { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }
}

/// <summary> DTO tạo mới hình ảnh sản phẩm </summary>
public class ProductImageCreateDto
{
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsMain { get; set; }
}

/// <summary> DTO dữ liệu cập nhật sản phẩm </summary>
public class ProductUpdateDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public decimal DefaultPrice { get; set; }
    public decimal? DefaultOriginalPrice { get; set; }
    public DateTime? DefaultDiscountEndDate { get; set; }
    public int DefaultStock { get; set; }
    public List<ProductSkuUpdateDto>? Skus { get; set; }
}

/// <summary> DTO cập nhật phiên bản sản phẩm (SKU) </summary>
public class ProductSkuUpdateDto
{
    public int Id { get; set; }
    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public DateTime? DiscountEndDate { get; set; }
    public int StockQuantity { get; set; }
}
#endregion
