using System.Security.Claims;
using Marketplace.Core.Entities;
using Marketplace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Marketplace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReturnsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ReturnsController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>Khách hàng gửi yêu cầu Trả hàng / Hoàn tiền</summary>
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateReturnRequest([FromBody] CreateReturnDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var subOrder = await _context.SubOrders
            .Include(so => so.Order)
            .FirstOrDefaultAsync(so => so.Id == dto.SubOrderId && so.Order!.UserId == userId);

        if (subOrder == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });

        if (subOrder.Status != OrderStatus.Delivered)
        {
            return BadRequest(new { message = "Chỉ có thể yêu cầu trả hàng đối với đơn hàng đã giao thành công." });
        }

        var existing = await _context.ReturnRequests.FirstOrDefaultAsync(r => r.SubOrderId == dto.SubOrderId);
        if (existing != null)
        {
            return BadRequest(new { message = "Bạn đã gửi yêu cầu đổi trả cho đơn hàng này trước đó." });
        }

        var request = new ReturnRequest
        {
            SubOrderId = dto.SubOrderId,
            UserId = userId,
            Reason = dto.Reason,
            RefundAmount = subOrder.SubTotal,
            Status = ReturnStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.ReturnRequests.Add(request);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Yêu cầu trả hàng/hoàn tiền đã được gửi. Vui lòng chờ Admin phê duyệt!" });
    }

    /// <summary>Khách hàng xem danh sách yêu cầu trả hàng của mình</summary>
    [Authorize]
    [HttpGet("my-requests")]
    public async Task<IActionResult> GetMyReturnRequests()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var requests = await _context.ReturnRequests
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.SubOrderId,
                r.Reason,
                r.RefundAmount,
                Status = r.Status.ToString(),
                r.AdminNote,
                r.CreatedAt,
                r.ProcessedAt
            })
            .ToListAsync();

        return Ok(requests);
    }

    /// <summary>[Admin] Xem tất cả yêu cầu trả hàng trên sàn</summary>
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAllReturnRequests()
    {
        var requests = await _context.ReturnRequests
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.SubOrderId,
                r.UserId,
                UserEmail = r.User != null ? r.User.Email : "",
                UserFullName = r.User != null ? r.User.FullName : "",
                r.Reason,
                r.RefundAmount,
                Status = r.Status.ToString(),
                r.AdminNote,
                r.CreatedAt,
                r.ProcessedAt
            })
            .ToListAsync();

        return Ok(requests);
    }

    /// <summary>[Admin] Xử lý duyệt / từ chối yêu cầu trả hàng</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/process")]
    public async Task<IActionResult> ProcessReturnRequest(int id, [FromBody] ProcessReturnDto dto)
    {
        var request = await _context.ReturnRequests.FindAsync(id);
        if (request == null) return NotFound(new { message = "Không tìm thấy yêu cầu." });

        if (request.Status != ReturnStatus.Pending)
        {
            return BadRequest(new { message = "Yêu cầu này đã được xử lý trước đó." });
        }

        request.Status = dto.IsApproved ? ReturnStatus.Approved : ReturnStatus.Rejected;
        request.AdminNote = dto.AdminNote;
        request.ProcessedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = dto.IsApproved ? "Đã duyệt trả hàng & hoàn tiền!" : "Đã từ chối yêu cầu trả hàng." });
    }
}

public class CreateReturnDto
{
    public int SubOrderId { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class ProcessReturnDto
{
    public bool IsApproved { get; set; }
    public string? AdminNote { get; set; }
}
