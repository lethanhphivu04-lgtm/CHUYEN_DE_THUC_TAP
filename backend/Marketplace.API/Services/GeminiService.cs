using System.Text;
using System.Text.Json;
using Marketplace.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Marketplace.API.Services;

public interface IGeminiService
{
    Task<string> ChatAsync(string userPrompt);
}

public class GeminiService : IGeminiService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;

    public GeminiService(HttpClient httpClient, IConfiguration configuration, ApplicationDbContext context)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _context = context;
    }

    public async Task<string> ChatAsync(string userPrompt)
    {
        var apiKey = _configuration["Gemini:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            return "Trợ lý AI hiện chưa được cấu hình API Key.";
        }

        // Fetch top products for context
        var topProducts = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Skus)
            .Take(10)
            .Select(p => new
            {
                p.Name,
                Category = p.Category != null ? p.Category.Name : "",
                MinPrice = p.Skus.Any() ? p.Skus.Min(s => s.Price) : 0
            })
            .ToListAsync();

        string productsContext = string.Join("\n", topProducts.Select(p => $"- {p.Name} (Danh mục: {p.Category}, Giá từ: {p.MinPrice:N0}đ)"));

        string systemContext = $@"Bạn là trợ lý AI thông minh của sàn thương mại điện tử HITU MARKET.
Nhiệm vụ của bạn là tư vấn nhiệt tình, lịch sự, tư vấn sản phẩm và giải đáp thắc mắc mua sắm cho khách hàng.
Dưới đây là một số sản phẩm đang bán trên HITU MARKET:
{productsContext}

Hãy trả lời câu hỏi của khách hàng một cách ngắn gọn, thân thiện bằng tiếng Việt. Khách hỏi: {userPrompt}";

        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = systemContext }
                    }
                }
            }
        };

        var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        string requestUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";

        try
        {
            var response = await _httpClient.PostAsync(requestUrl, jsonContent);
            if (response.IsSuccessStatusCode)
            {
                var responseString = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseString);
                if (doc.RootElement.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
                {
                    var text = candidates[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text")
                        .GetString();
                    if (!string.IsNullOrEmpty(text)) return text;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Gemini API Error]: {ex.Message}");
        }

        // Smart fallback response based on store knowledge base & database products
        string lowerPrompt = userPrompt.ToLower();
        if (lowerPrompt.Contains("giao hàng") || lowerPrompt.Contains("đổi trả") || lowerPrompt.Contains("vận chuyển") || lowerPrompt.Contains("chính sách"))
        {
            return "📦 **Chính sách Giao hàng & Đổi trả tại HITU MARKET:**\n\n1. **Thời gian giao hàng:** Từ 2 - 4 ngày làm việc trên toàn quốc.\n2. **Quyền lợi đổi trả:** Đổi trả miễn phí trong vòng **7 ngày** kể từ khi nhận hàng nếu sản phẩm có lỗi từ nhà sản xuất hoặc không đúng mô tả.\n3. **Đồng kiểm:** Khách hàng được quyền kiểm tra hàng trước khi thanh toán COD.";
        }

        if (lowerPrompt.Contains("thanh toán") || lowerPrompt.Contains("vnpay") || lowerPrompt.Contains("ví") || lowerPrompt.Contains("cod"))
        {
            return "💳 **Phương thức Thanh toán tại HITU MARKET:**\n\nHệ thống hỗ trợ thanh toán khi nhận hàng (COD) và Thanh toán trực tuyến bảo mật qua cổng **VNPay** (Thẻ ATM nội địa, QR Code, Visa/MasterCard).";
        }

        if (topProducts.Any())
        {
            return $"🛍️ **Các sản phẩm nổi bật đang bán tại HITU MARKET:**\n\n{productsContext}\n\nBạn có muốn tìm hiểu thêm về sản phẩm nào ở trên không?";
        }

        return "Xin chào! Trợ lý HITU MARKET luôn sẵn sàng hỗ trợ bạn tư vấn mua sắm, kiểm tra đơn hàng và lựa chọn sản phẩm phù hợp nhất!";
    }
}
