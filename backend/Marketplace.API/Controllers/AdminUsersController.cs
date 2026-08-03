using Marketplace.Core.Entities;
using Marketplace.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Marketplace.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/[controller]")]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public UsersController(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    /// <summary>[Admin] Lấy danh sách người dùng hệ thống</summary>
    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] string? search)
    {
        var query = _userManager.Users.AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(u => u.Email!.Contains(search) || u.FullName.Contains(search));
        }

        var users = await query.OrderByDescending(u => u.CreatedAt).ToListAsync();
        var userDtos = new List<object>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            userDtos.Add(new
            {
                user.Id,
                user.Email,
                user.FullName,
                user.PhoneNumber,
                user.CreatedAt,
                user.LockoutEnd,
                IsLocked = user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow,
                Roles = roles
            });
        }

        return Ok(userDtos);
    }

    /// <summary>[Admin] Khóa hoặc Mở khóa tài khoản người dùng</summary>
    [HttpPost("{id}/toggle-lock")]
    public async Task<IActionResult> ToggleLockUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(new { message = "Không tìm thấy người dùng." });

        if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow)
        {
            // Unlock
            user.LockoutEnd = null;
            await _userManager.UpdateAsync(user);
            return Ok(new { message = $"Đã mở khóa tài khoản {user.Email}." });
        }
        else
        {
            // Lock out for 100 years
            user.LockoutEnd = DateTimeOffset.UtcNow.AddYears(100);
            await _userManager.UpdateAsync(user);
            return Ok(new { message = $"Đã khóa tài khoản {user.Email}." });
        }
    }

    /// <summary>[Admin] Gán vai trò cho người dùng (Admin, Seller, Customer)</summary>
    [HttpPost("{id}/assign-role")]
    public async Task<IActionResult> AssignRole(string id, [FromBody] AssignRoleDto dto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(new { message = "Không tìm thấy người dùng." });

        if (!await _roleManager.RoleExistsAsync(dto.RoleName))
        {
            return BadRequest(new { message = $"Vai trò \"{dto.RoleName}\" không tồn tại." });
        }

        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRoleAsync(user, dto.RoleName);

        return Ok(new { message = $"Đã gán vai trò {dto.RoleName} cho {user.Email}." });
    }
}

public class AssignRoleDto
{
    public string RoleName { get; set; } = string.Empty;
}
