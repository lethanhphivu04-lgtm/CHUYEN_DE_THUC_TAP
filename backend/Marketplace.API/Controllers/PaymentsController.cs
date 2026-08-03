using System.Security.Claims;
using System.Text.Json;
using Marketplace.API.Services;
using Marketplace.Core.Entities;
using Marketplace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Marketplace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IVnPayService _vnPayService;

    public PaymentsController(ApplicationDbContext context, IVnPayService vnPayService)
    {
        _context = context;
        _vnPayService = vnPayService;
    }

    /// <summary>Tạo URL chuyển hướng sang cổng thanh toán VNPay</summary>
    [Authorize]
    [HttpPost("create-vnpay-url")]
    public async Task<IActionResult> CreateVnPayUrl([FromBody] CreateVnPayUrlDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == dto.OrderId && o.UserId == userId);

        if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });

        string txnRef = $"HITU_{order.Id}_{DateTime.UtcNow.Ticks}";

        // Check if existing pending payment exists, or create new
        var payment = await _context.Payments
            .FirstOrDefaultAsync(p => p.OrderId == order.Id && p.Status == PaymentStatus.Pending);

        if (payment == null)
        {
            payment = new Payment
            {
                OrderId = order.Id,
                UserId = userId,
                PaymentMethod = "VNPay",
                Amount = order.TotalAmount,
                Status = PaymentStatus.Pending,
                TxnRef = txnRef,
                CreatedAt = DateTime.UtcNow
            };
            _context.Payments.Add(payment);
        }
        else
        {
            payment.TxnRef = txnRef;
            payment.PaymentMethod = "VNPay";
            payment.Amount = order.TotalAmount;
        }

        await _context.SaveChangesAsync();

        string paymentUrl = _vnPayService.CreatePaymentUrl(HttpContext, order, txnRef);

        return Ok(new { paymentUrl, txnRef, orderId = order.Id });
    }

    /// <summary>Xử lý Callback/Return từ VNPay sau khi khách thanh toán thành công hoặc hủy</summary>
    [HttpGet("vnpay-return")]
    public async Task<IActionResult> VnPayReturn()
    {
        var response = _vnPayService.ProcessCallback(Request.Query);

        var payment = await _context.Payments
            .Include(p => p.Order)
                .ThenInclude(o => o!.SubOrders)
            .FirstOrDefaultAsync(p => p.TxnRef == response.TxnRef);

        if (payment == null)
        {
            return BadRequest(new { success = false, message = "Không tìm thấy mã giao dịch thanh toán." });
        }

        // Save Raw Log
        string rawQuery = Request.QueryString.Value ?? string.Empty;
        payment.Logs.Add(new PaymentLog
        {
            RawData = rawQuery,
            CreatedAt = DateTime.UtcNow
        });

        if (response.Success)
        {
            payment.Status = PaymentStatus.Success;
            payment.PaidAt = DateTime.UtcNow;
            payment.VnPayTransactionNo = response.VnPayTransactionNo;

            // Optionally update order status
            if (payment.Order != null)
            {
                foreach (var subOrder in payment.Order.SubOrders)
                {
                    if (subOrder.Status == OrderStatus.Pending)
                    {
                        subOrder.Status = OrderStatus.Processing;
                        subOrder.UpdatedAt = DateTime.UtcNow;
                        subOrder.StatusHistories.Add(new OrderStatusHistory
                        {
                            FromStatus = OrderStatus.Pending,
                            ToStatus = OrderStatus.Processing,
                            Note = $"Đã thanh toán VNPay thành công (Mã GD: {response.VnPayTransactionNo})"
                        });
                    }
                }
            }
        }
        else
        {
            payment.Status = PaymentStatus.Failed;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = response.Success,
            message = response.Message,
            orderId = payment.OrderId,
            txnRef = response.TxnRef,
            vnPayTransactionNo = response.VnPayTransactionNo,
            responseCode = response.ResponseCode
        });
    }

    /// <summary>Lấy thông tin thanh toán theo Order ID</summary>
    [Authorize]
    [HttpGet("order/{orderId}")]
    public async Task<IActionResult> GetPaymentByOrderId(int orderId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var payment = await _context.Payments
            .Where(p => p.OrderId == orderId && p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.OrderId,
                p.PaymentMethod,
                p.Amount,
                Status = p.Status.ToString(),
                p.TxnRef,
                p.VnPayTransactionNo,
                p.CreatedAt,
                p.PaidAt
            })
            .FirstOrDefaultAsync();

        if (payment == null) return NotFound(new { message = "Chưa có thông tin thanh toán." });

        return Ok(payment);
    }
}

public class CreateVnPayUrlDto
{
    public int OrderId { get; set; }
}
