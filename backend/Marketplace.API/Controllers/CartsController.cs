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
public class CartsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CartsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyCart()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var cart = await GetOrCreateCart(userId);

        var items = await _context.CartItems
            .Where(ci => ci.CartId == cart.Id)
            .Include(ci => ci.ProductSku)
                .ThenInclude(ps => ps!.Product)
                    .ThenInclude(p => p!.Images)
            .Include(ci => ci.ProductSku)
                .ThenInclude(ps => ps!.Product)
                    .ThenInclude(p => p!.Seller)
            .Select(ci => new
            {
                ci.Id,
                ci.Quantity,
                Sku = new
                {
                    ci.ProductSku!.Id,
                    ci.ProductSku.SkuCode,
                    ci.ProductSku.Price,
                    ci.ProductSku.StockQuantity,
                    ci.ProductSku.Size,
                    ci.ProductSku.Color,
                },
                Product = new
                {
                    ci.ProductSku!.Product!.Id,
                    ci.ProductSku.Product.Name,
                    ci.ProductSku.Product.SellerId,
                    ShopName = ci.ProductSku.Product.Seller != null ? ci.ProductSku.Product.Seller.ShopName : "",
                    MainImage = ci.ProductSku.Product.Images.Where(i => i.IsMain).Select(i => i.ImageUrl).FirstOrDefault()
                        ?? ci.ProductSku.Product.Images.Select(i => i.ImageUrl).FirstOrDefault()
                        ?? ""
                }
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> AddItem([FromBody] CartAddDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        // Validate SKU exists and has stock
        var sku = await _context.ProductSkus.Include(s => s.Product).FirstOrDefaultAsync(s => s.Id == dto.ProductSkuId);
        if (sku == null) return NotFound(new { message = "SKU không tồn tại." });
        if (sku.StockQuantity < dto.Quantity)
            return BadRequest(new { message = $"Tồn kho không đủ. Còn lại: {sku.StockQuantity}" });

        // Block seller buying own product
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller != null && sku.Product != null && sku.Product.SellerId == seller.Id)
            return BadRequest(new { message = "Bạn không thể mua sản phẩm của chính mình." });

        var cart = await GetOrCreateCart(userId);

        // Check if item already exists
        var existing = await _context.CartItems.FirstOrDefaultAsync(ci => ci.CartId == cart.Id && ci.ProductSkuId == dto.ProductSkuId);
        if (existing != null)
        {
            var newQty = existing.Quantity + dto.Quantity;
            if (newQty > sku.StockQuantity)
                return BadRequest(new { message = $"Tồn kho không đủ. Còn lại: {sku.StockQuantity}" });
            existing.Quantity = newQty;
        }
        else
        {
            _context.CartItems.Add(new CartItem
            {
                CartId = cart.Id,
                ProductSkuId = dto.ProductSkuId,
                Quantity = dto.Quantity
            });
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Đã thêm vào giỏ hàng." });
    }

    [HttpPut("{itemId}")]
    public async Task<IActionResult> UpdateQuantity(int itemId, [FromBody] CartUpdateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId);
        if (cart == null) return NotFound();

        var item = await _context.CartItems.Include(ci => ci.ProductSku).FirstOrDefaultAsync(ci => ci.Id == itemId && ci.CartId == cart.Id);
        if (item == null) return NotFound(new { message = "Không tìm thấy sản phẩm trong giỏ." });

        if (dto.Quantity <= 0)
        {
            _context.CartItems.Remove(item);
        }
        else
        {
            if (item.ProductSku != null && dto.Quantity > item.ProductSku.StockQuantity)
                return BadRequest(new { message = $"Tồn kho không đủ. Còn lại: {item.ProductSku.StockQuantity}" });
            item.Quantity = dto.Quantity;
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Cập nhật giỏ hàng thành công." });
    }

    [HttpDelete("{itemId}")]
    public async Task<IActionResult> RemoveItem(int itemId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId);
        if (cart == null) return NotFound();

        var item = await _context.CartItems.FirstOrDefaultAsync(ci => ci.Id == itemId && ci.CartId == cart.Id);
        if (item == null) return NotFound(new { message = "Không tìm thấy sản phẩm trong giỏ." });

        _context.CartItems.Remove(item);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Đã xóa khỏi giỏ hàng." });
    }

    private async Task<Cart> GetOrCreateCart(string userId)
    {
        var cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId);
        if (cart == null)
        {
            cart = new Cart { UserId = userId };
            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();
        }
        return cart;
    }
}

public class CartAddDto
{
    public int ProductSkuId { get; set; }
    public int Quantity { get; set; } = 1;
}

public class CartUpdateDto
{
    public int Quantity { get; set; }
}
