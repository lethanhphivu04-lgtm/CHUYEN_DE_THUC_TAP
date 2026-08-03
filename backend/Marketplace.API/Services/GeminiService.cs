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
                var candidates = doc.RootElement.GetProperty("candidates");
                if (candidates.GetArrayLength() > 0)
                {
                    var text = candidates[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text")
                        .GetString();
                    return text ?? "HITU Bot đã sẵn sàng hỗ trợ bạn!";
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Gemini API Error]: {ex.Message}");
        }

        return $"Xin chào! Tôi là HITU Bot. Rất tiếc tôi gặp chút sự cố kết nối tới AI Studio, nhưng tôi luôn sẵn sàng hỗ trợ bạn mua sắm tại HITU MARKET cho sản phẩm: \"{userPrompt}\".";
    }
}
