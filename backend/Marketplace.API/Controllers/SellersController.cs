using System.Security.Claims;
using Marketplace.Core.Entities;
using Marketplace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Marketplace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SellersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public SellersController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    /// <summary>Đăng ký làm Người bán (Seller)</summary>
    [Authorize]
    [HttpPost("register")]
    public async Task<IActionResult> RegisterSeller([FromBody] RegisterSellerDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var existingSeller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (existingSeller != null)
        {
            return BadRequest(new { message = "Bạn đã đăng ký thông tin Người bán trước đó." });
        }

        var seller = new Seller
        {
            UserId = userId,
            ShopName = dto.ShopName,
            Description = dto.Description ?? string.Empty,
            LogoUrl = dto.LogoUrl,
            IsActive = true, // Tự động active hoặc để Admin duyệt tùy quy trình
            Status = SellerStatus.Approved, // Mặc định auto-approve trong demo/thực tập để trải nghiệm mượt mà
            CreatedAt = DateTime.UtcNow,
            Wallet = new SellerWallet
            {
                Balance = 0,
                LockedBalance = 0,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _context.Sellers.Add(seller);

        // Thêm Role Seller cho User
        var user = await _userManager.FindByIdAsync(userId);
        if (user != null && !await _userManager.IsInRoleAsync(user, "Seller"))
        {
            await _userManager.AddToRoleAsync(user, "Seller");
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Đăng ký Người bán thành công!", sellerId = seller.Id });
    }

    /// <summary>Lấy thông tin Shop của tôi</summary>
    [Authorize]
    [HttpGet("my-shop")]
    public async Task<IActionResult> GetMyShop()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var seller = await _context.Sellers
            .Include(s => s.Wallet)
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (seller == null) return NotFound(new { message = "Bạn chưa đăng ký làm Người bán." });

        return Ok(new
        {
            seller.Id,
            seller.ShopName,
            seller.Description,
            seller.LogoUrl,
            seller.IsActive,
            Status = seller.Status.ToString(),
            seller.CreatedAt,
            Wallet = seller.Wallet != null ? new
            {
                seller.Wallet.Balance,
                seller.Wallet.LockedBalance
            } : null
        });
    }

    /// <summary>Cập nhật thông tin Shop của tôi</summary>
    [Authorize]
    [HttpPut("my-shop")]
    public async Task<IActionResult> UpdateMyShop([FromBody] UpdateSellerDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return NotFound(new { message = "Không tìm thấy gian hàng." });

        seller.ShopName = dto.ShopName;
        seller.Description = dto.Description ?? seller.Description;
        if (!string.IsNullOrEmpty(dto.LogoUrl)) seller.LogoUrl = dto.LogoUrl;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Cập nhật thông tin gian hàng thành công!" });
    }

    /// <summary>Thống kê Dashboard Seller (Doanh thu, Đơn hàng, Ví tiền)</summary>
    [Authorize]
    [HttpGet("dashboard-stats")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var seller = await _context.Sellers
            .Include(s => s.Wallet)
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (seller == null) return NotFound(new { message = "Không tìm thấy thông tin gian hàng." });

        var subOrders = await _context.SubOrders
            .Where(so => so.SellerId == seller.Id)
            .ToListAsync();

        decimal totalRevenue = subOrders
            .Where(so => so.Status == OrderStatus.Delivered)
            .Sum(so => so.SubTotal);

        int totalOrders = subOrders.Count;
        int pendingOrders = subOrders.Count(so => so.Status == OrderStatus.Pending);
        int totalProducts = await _context.Products.CountAsync(p => p.SellerId == seller.Id);

        return Ok(new
        {
            totalRevenue,
            walletBalance = seller.Wallet?.Balance ?? 0,
            lockedBalance = seller.Wallet?.LockedBalance ?? 0,
            totalOrders,
            pendingOrders,
            totalProducts
        });
    }

    /// <summary>Lấy danh sách đơn hàng con thuộc gian hàng của Seller</summary>
    [Authorize]
    [HttpGet("orders")]
    public async Task<IActionResult> GetSellerOrders()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return NotFound(new { message = "Bạn chưa có gian hàng." });

        var orders = await _context.SubOrders
            .Where(so => so.SellerId == seller.Id)
            .OrderByDescending(so => so.CreatedAt)
            .Select(so => new
            {
                so.Id,
                so.OrderId,
                so.SubTotal,
                Status = so.Status.ToString(),
                so.CreatedAt,
                PaymentMethod = so.Order != null ? so.Order.PaymentMethod : "COD",
                AddressSnapshot = so.Order != null ? so.Order.AddressSnapshot : "",
                Items = so.Items.Select(i => new
                {
                    i.Id,
                    i.ProductName,
                    i.SkuInfo,
                    i.PriceSnapshot,
                    i.Quantity,
                    i.ImageUrl
                }).ToList(),
                StatusHistories = so.StatusHistories.OrderBy(h => h.CreatedAt).Select(h => new
                {
                    From = h.FromStatus.ToString(),
                    To = h.ToStatus.ToString(),
                    h.Note,
                    h.CreatedAt
                }).ToList()
            })
            .ToListAsync();

        return Ok(orders);
    }

    /// <summary>Lấy thông tin ví và lịch sử biến động số dư của Seller</summary>
    [Authorize]
    [HttpGet("wallet")]
    public async Task<IActionResult> GetWalletInfo()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return NotFound(new { message = "Không tìm thấy gian hàng." });

        var wallet = await _context.SellerWallets
            .Include(w => w.Transactions)
            .FirstOrDefaultAsync(w => w.SellerId == seller.Id);

        if (wallet == null)
        {
            wallet = new SellerWallet { SellerId = seller.Id };
            _context.SellerWallets.Add(wallet);
            await _context.SaveChangesAsync();
        }

        var withdrawalRequests = await _context.WithdrawalRequests
            .Where(w => w.SellerId == seller.Id)
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new
            {
                w.Id,
                w.Amount,
                w.BankName,
                w.AccountNumber,
                w.AccountHolder,
                Status = w.Status.ToString(),
                w.Note,
                w.CreatedAt,
                w.ProcessedAt
            })
            .ToListAsync();

        return Ok(new
        {
            wallet.Balance,
            wallet.LockedBalance,
            Transactions = wallet.Transactions.OrderByDescending(t => t.CreatedAt).Select(t => new
            {
                t.Id,
                t.Amount,
                Type = t.Type.ToString(),
                t.Description,
                t.CreatedAt
            }).ToList(),
            WithdrawalRequests = withdrawalRequests
        });
    }

    /// <summary>Tạo yêu cầu rút tiền từ Ví người bán</summary>
    [Authorize]
    [HttpPost("withdraw")]
    public async Task<IActionResult> CreateWithdrawalRequest([FromBody] CreateWithdrawalDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null) return NotFound(new { message = "Không tìm thấy gian hàng." });

        var wallet = await _context.SellerWallets.FirstOrDefaultAsync(w => w.SellerId == seller.Id);
        if (wallet == null || wallet.Balance < dto.Amount || dto.Amount <= 0)
        {
            return BadRequest(new { message = "Số dư không đủ hoặc số tiền rút không hợp lệ." });
        }

        wallet.Balance -= dto.Amount;
        wallet.LockedBalance += dto.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        var request = new WithdrawalRequest
        {
            SellerId = seller.Id,
            Amount = dto.Amount,
            BankName = dto.BankName,
            AccountNumber = dto.AccountNumber,
            AccountHolder = dto.AccountHolder,
            Status = WithdrawalStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.WithdrawalRequests.Add(request);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Tạo yêu cầu rút tiền thành công. Vui lòng chờ Admin xử lý!" });
    }

    // ==========================================
    // ADMIN ENDPOINTS
    // ==========================================

    /// <summary>[Admin] Lấy danh sách tất cả các Gian hàng</summary>
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAllSellers([FromQuery] string? status)
    {
        var query = _context.Sellers.Include(s => s.User).Include(s => s.Wallet).AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<SellerStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(s => s.Status == parsedStatus);
        }

        var sellers = await query
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new
            {
                s.Id,
                s.UserId,
                UserEmail = s.User != null ? s.User.Email : "",
                UserFullName = s.User != null ? s.User.FullName : "",
                s.ShopName,
                s.Description,
                s.LogoUrl,
                s.IsActive,
                Status = s.Status.ToString(),
                s.CreatedAt,
                Balance = s.Wallet != null ? s.Wallet.Balance : 0
            })
            .ToListAsync();

        return Ok(sellers);
    }

    /// <summary>[Admin] Phê duyệt mở shop</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveSeller(int id)
    {
        var seller = await _context.Sellers.Include(s => s.Wallet).FirstOrDefaultAsync(s => s.Id == id);
        if (seller == null) return NotFound(new { message = "Không tìm thấy gian hàng." });

        seller.Status = SellerStatus.Approved;
        seller.IsActive = true;

        if (seller.Wallet == null)
        {
            seller.Wallet = new SellerWallet { SellerId = seller.Id, Balance = 0, LockedBalance = 0 };
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = $"Đã duyệt gian hàng \"{seller.ShopName}\"." });
    }

    /// <summary>[Admin] Từ chối / Khóa shop</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectSeller(int id, [FromBody] RejectSellerDto dto)
    {
        var seller = await _context.Sellers.FindAsync(id);
        if (seller == null) return NotFound(new { message = "Không tìm thấy gian hàng." });

        seller.Status = SellerStatus.Rejected;
        seller.IsActive = false;

        await _context.SaveChangesAsync();
        return Ok(new { message = $"Đã từ chối/khóa gian hàng \"{seller.ShopName}\"." });
    }

    /// <summary>[Admin] Danh sách tất cả yêu cầu rút tiền</summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("withdrawals")]
    public async Task<IActionResult> GetAllWithdrawalRequests()
    {
        var list = await _context.WithdrawalRequests
            .Include(w => w.Seller)
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new
            {
                w.Id,
                w.SellerId,
                ShopName = w.Seller != null ? w.Seller.ShopName : "",
                w.Amount,
                w.BankName,
                w.AccountNumber,
                w.AccountHolder,
                Status = w.Status.ToString(),
                w.Note,
                w.CreatedAt,
                w.ProcessedAt
            })
            .ToListAsync();

        return Ok(list);
    }

    /// <summary>[Admin] Xử lý duyệt/từ chối lệnh rút tiền</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("withdrawals/{id}/process")]
    public async Task<IActionResult> ProcessWithdrawal(int id, [FromBody] ProcessWithdrawalDto dto)
    {
        var request = await _context.WithdrawalRequests
            .Include(w => w.Seller)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (request == null) return NotFound(new { message = "Không tìm thấy yêu cầu rút tiền." });
        if (request.Status != WithdrawalStatus.Pending)
            return BadRequest(new { message = "Yêu cầu này đã được xử lý trước đó." });

        var wallet = await _context.SellerWallets.FirstOrDefaultAsync(w => w.SellerId == request.SellerId);
        if (wallet == null) return BadRequest(new { message = "Không tìm thấy ví của gian hàng." });

        if (dto.IsApproved)
        {
            request.Status = WithdrawalStatus.Approved;
            request.ProcessedAt = DateTime.UtcNow;
            request.Note = dto.Note ?? "Admin đã chuyển khoản thành công";

            wallet.LockedBalance -= request.Amount;
            wallet.Transactions.Add(new WalletTransaction
            {
                WalletId = wallet.Id,
                Amount = -request.Amount,
                Type = TransactionType.Withdrawal,
                Description = $"Rút tiền về ngân hàng {request.BankName} - STK: {request.AccountNumber}",
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            request.Status = WithdrawalStatus.Rejected;
            request.ProcessedAt = DateTime.UtcNow;
            request.Note = dto.Note ?? "Admin từ chối yêu cầu";

            // Hoàn lại tiền từ LockedBalance về Balance
            wallet.LockedBalance -= request.Amount;
            wallet.Balance += request.Amount;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = dto.IsApproved ? "Đã duyệt chuyển tiền cho Seller!" : "Đã từ chối lệnh rút tiền." });
    }
}

public class RegisterSellerDto
{
    public string ShopName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
}

public class UpdateSellerDto
{
    public string ShopName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
}

public class CreateWithdrawalDto
{
    public decimal Amount { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountHolder { get; set; } = string.Empty;
}

public class RejectSellerDto
{
    public string? Reason { get; set; }
}

public class ProcessWithdrawalDto
{
    public bool IsApproved { get; set; }
    public string? Note { get; set; }
}
