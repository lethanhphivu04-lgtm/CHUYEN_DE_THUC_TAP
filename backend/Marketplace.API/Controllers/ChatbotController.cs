using Marketplace.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Marketplace.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatbotController : ControllerBase
{
    private readonly IGeminiService _geminiService;

    public ChatbotController(IGeminiService geminiService)
    {
        _geminiService = geminiService;
    }

    /// <summary>Gửi câu hỏi tư vấn mua sắm cho Trợ lý AI Gemini</summary>
    [HttpPost("ask")]
    public async Task<IActionResult> AskChatbot([FromBody] ChatRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Prompt))
        {
            return BadRequest(new { message = "Vui lòng nhập nội dung câu hỏi." });
        }

        string answer = await _geminiService.ChatAsync(dto.Prompt);
        return Ok(new { reply = answer });
    }
}

public class ChatRequestDto
{
    public string Prompt { get; set; } = string.Empty;
}
