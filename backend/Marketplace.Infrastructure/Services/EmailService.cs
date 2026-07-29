using System.Net;
using System.Net.Mail;
using Marketplace.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Marketplace.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlMessage)
    {
        var smtpHost = _configuration["SmtpSettings:Host"];
        var smtpPortStr = _configuration["SmtpSettings:Port"];
        var smtpUser = _configuration["SmtpSettings:Username"];
        var smtpPass = _configuration["SmtpSettings:Password"];
        var fromEmail = _configuration["SmtpSettings:FromEmail"] ?? "no-reply@hitumarket.vn";
        var fromName = _configuration["SmtpSettings:FromName"] ?? "HITU MARKET";

        if (string.IsNullOrEmpty(smtpHost) || string.IsNullOrEmpty(smtpUser) || string.IsNullOrEmpty(smtpPass))
        {
            _logger.LogWarning("SMTP Settings are not configured. Logging the email instead:");
            _logger.LogWarning("To: {ToEmail}", toEmail);
            _logger.LogWarning("Subject: {Subject}", subject);
            _logger.LogWarning("Message: {Message}", htmlMessage);
            await Task.CompletedTask;
            return;
        }

        int smtpPort = int.TryParse(smtpPortStr, out var port) ? port : 587;

        try
        {
            using var mailMessage = new MailMessage();
            mailMessage.From = new MailAddress(fromEmail, fromName);
            mailMessage.To.Add(new MailAddress(toEmail));
            mailMessage.Subject = subject;
            mailMessage.Body = htmlMessage;
            mailMessage.IsBodyHtml = true;

            using var smtpClient = new SmtpClient(smtpHost, smtpPort);
            smtpClient.Credentials = new NetworkCredential(smtpUser, smtpPass);
            smtpClient.EnableSsl = true;

            await smtpClient.SendMailAsync(mailMessage);
            _logger.LogInformation("Email sent successfully to {ToEmail}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {ToEmail}", toEmail);
            throw;
        }
    }
}
