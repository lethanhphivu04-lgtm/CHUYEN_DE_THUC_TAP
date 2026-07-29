namespace Marketplace.Core.Entities;

public class RefreshToken
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string JwtId { get; set; } = string.Empty;
    public bool IsUsed { get; set; } = false;
    public bool IsRevoked { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }

    public ApplicationUser? User { get; set; }
}
