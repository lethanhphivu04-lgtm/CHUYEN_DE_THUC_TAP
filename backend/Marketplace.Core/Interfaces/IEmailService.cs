using System.Threading.Tasks;

namespace Marketplace.Core.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string htmlMessage);
}
