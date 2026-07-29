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
public class AddressesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AddressesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyAddresses()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var addresses = await _context.Addresses
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Ok(addresses);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAddressById(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var address = await _context.Addresses
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        if (address == null) return NotFound(new { message = "Không tìm thấy địa chỉ." });

        return Ok(address);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAddress([FromBody] AddressCreateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var hasExistingAddresses = await _context.Addresses.AnyAsync(a => a.UserId == userId);
        bool shouldBeDefault = !hasExistingAddresses || dto.IsDefault;

        if (shouldBeDefault)
        {
            await ResetOtherDefaults(userId);
        }

        var address = new Address
            {
                UserId = userId,
                ReceiverName = dto.ReceiverName,
                Phone = dto.Phone,
                StreetAddress = dto.StreetAddress,
                Ward = dto.Ward,
                District = dto.District,
                City = dto.City,
                IsDefault = shouldBeDefault,
                CreatedAt = DateTime.UtcNow
            };

        _context.Addresses.Add(address);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAddressById), new { id = address.Id }, address);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAddress(int id, [FromBody] AddressUpdateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var address = await _context.Addresses
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        if (address == null) return NotFound(new { message = "Không tìm thấy địa chỉ." });

        address.ReceiverName = dto.ReceiverName;
        address.Phone = dto.Phone;
        address.StreetAddress = dto.StreetAddress;
        address.Ward = dto.Ward;
        address.District = dto.District;
        address.City = dto.City;

        if (dto.IsDefault && !address.IsDefault)
        {
            await ResetOtherDefaults(userId);
            address.IsDefault = true;
        }
        else if (!dto.IsDefault && address.IsDefault)
        {
            // If trying to unset default, check if there are other addresses. 
            // If yes, make another one default.
            var otherAddress = await _context.Addresses
                .FirstOrDefaultAsync(a => a.UserId == userId && a.Id != id);
            if (otherAddress != null)
            {
                otherAddress.IsDefault = true;
                address.IsDefault = false;
            }
            else
            {
                // Can't unset default if it's the only address
                address.IsDefault = true;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(address);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAddress(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var address = await _context.Addresses
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        if (address == null) return NotFound(new { message = "Không tìm thấy địa chỉ." });

        bool wasDefault = address.IsDefault;

        _context.Addresses.Remove(address);
        await _context.SaveChangesAsync();

        if (wasDefault)
        {
            // Make another address default if available
            var newDefault = await _context.Addresses
                .FirstOrDefaultAsync(a => a.UserId == userId);
            if (newDefault != null)
            {
                newDefault.IsDefault = true;
                await _context.SaveChangesAsync();
            }
        }

        return Ok(new { message = "Xóa địa chỉ thành công." });
    }

    private async Task ResetOtherDefaults(string userId)
    {
        var defaultAddresses = await _context.Addresses
            .Where(a => a.UserId == userId && a.IsDefault)
            .ToListAsync();

        foreach (var addr in defaultAddresses)
        {
            addr.IsDefault = false;
        }
    }
}

public class AddressCreateDto
{
    public string ReceiverName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string StreetAddress { get; set; } = string.Empty;
    public string Ward { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public bool IsDefault { get; set; } = false;
}

public class AddressUpdateDto
{
    public string ReceiverName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string StreetAddress { get; set; } = string.Empty;
    public string Ward { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public bool IsDefault { get; set; } = false;
}
