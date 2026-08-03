using Marketplace.Core.Entities;
using Marketplace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Marketplace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VouchersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public VouchersController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>Lấy danh sách mã giảm giá đang áp dụng</summary>
    [HttpGet]
    public async Task<IActionResult> GetActiveVouchers()
    {
        var now = DateTime.UtcNow;
        var vouchers = await _context.Vouchers
            .Where(v => v.IsActive && v.StartDate <= now && v.ExpiryDate >= now && v.UsedCount < v.UsageLimit)
            .OrderByDescending(v => v.StartDate)
            .ToListAsync();

        return Ok(vouchers);
    }

    /// <summary>Kiểm tra và Áp dụng mã giảm giá khi Checkout</summary>
    [HttpPost("apply")]
    public async Task<IActionResult> ApplyVoucher([FromBody] ApplyVoucherDto dto)
    {
        var now = DateTime.UtcNow;
        var voucher = await _context.Vouchers
            .FirstOrDefaultAsync(v => v.Code == dto.Code.ToUpper() && v.IsActive);

        if (voucher == null || voucher.StartDate > now || voucher.ExpiryDate < now)
        {
            return BadRequest(new { message = "Mã giảm giá không tồn tại hoặc đã hết hạn." });
        }

        if (voucher.UsedCount >= voucher.UsageLimit)
        {
            return BadRequest(new { message = "Mã giảm giá đã hết lượt sử dụng." });
        }

        if (dto.OrderAmount < voucher.MinOrderAmount)
        {
            return BadRequest(new { message = $"Đơn hàng tối thiểu phải từ {voucher.MinOrderAmount:N0}đ để dùng mã này." });
        }

        decimal discount = 0;
        if (voucher.DiscountAmount.HasValue && voucher.DiscountAmount > 0)
        {
            discount = voucher.DiscountAmount.Value;
        }
        else if (voucher.DiscountPercent.HasValue && voucher.DiscountPercent > 0)
        {
            discount = dto.OrderAmount * (voucher.DiscountPercent.Value / 100m);
            if (voucher.MaxDiscountAmount.HasValue && discount > voucher.MaxDiscountAmount.Value)
            {
                discount = voucher.MaxDiscountAmount.Value;
            }
        }

        return Ok(new
        {
            code = voucher.Code,
            discountAmount = discount,
            finalAmount = Math.Max(0, dto.OrderAmount - discount),
            message = $"Áp dụng mã giảm giá thành công! Giảm {discount:N0}đ."
        });
    }

    /// <summary>[Admin] Tạo mã giảm giá mới</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateVoucher([FromBody] Voucher dto)
    {
        dto.Code = dto.Code.ToUpper();
        if (await _context.Vouchers.AnyAsync(v => v.Code == dto.Code))
        {
            return BadRequest(new { message = "Mã giảm giá đã tồn tại." });
        }

        _context.Vouchers.Add(dto);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Tạo mã giảm giá thành công!", voucher = dto });
    }

    /// <summary>[Admin] Xóa mã giảm giá</summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVoucher(int id)
    {
        var v = await _context.Vouchers.FindAsync(id);
        if (v == null) return NotFound();

        _context.Vouchers.Remove(v);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đã xóa mã giảm giá." });
    }
}

public class ApplyVoucherDto
{
    public string Code { get; set; } = string.Empty;
    public decimal OrderAmount { get; set; }
}
