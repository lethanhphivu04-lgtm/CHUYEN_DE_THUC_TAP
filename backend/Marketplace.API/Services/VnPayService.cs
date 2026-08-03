using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using Marketplace.Core.Entities;

namespace Marketplace.API.Services;

public interface IVnPayService
{
    string CreatePaymentUrl(HttpContext httpContext, Order order, string txnRef);
    bool ValidateSignature(IQueryCollection query);
    PaymentResponseDto ProcessCallback(IQueryCollection query);
}

public class PaymentResponseDto
{
    public bool Success { get; set; }
    public string TxnRef { get; set; } = string.Empty;
    public string VnPayTransactionNo { get; set; } = string.Empty;
    public string ResponseCode { get; set; } = string.Empty;
    public string OrderInfo { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class VnPayService : IVnPayService
{
    private readonly IConfiguration _configuration;

    public VnPayService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string CreatePaymentUrl(HttpContext httpContext, Order order, string txnRef)
    {
        var vnpayConfig = _configuration.GetSection("VnPay");
        var tmnCode = vnpayConfig["TmnCode"];
        var hashSecret = vnpayConfig["HashSecret"];
        var baseUrl = vnpayConfig["BaseUrl"];
        var returnUrl = vnpayConfig["ReturnUrl"];
        var version = vnpayConfig["Version"] ?? "2.1.0";
        var command = vnpayConfig["Command"] ?? "pay";
        var currCode = vnpayConfig["CurrCode"] ?? "VND";
        var locale = vnpayConfig["Locale"] ?? "vn";

        DateTime timeNow;
        try
        {
            var timeZoneById = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            timeNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZoneById);
        }
        catch
        {
            timeNow = DateTime.UtcNow.AddHours(7);
        }
        var tick = timeNow.ToString("yyyyMMddHHmmss");

        // Amount in VNPay is multiplied by 100
        long amountInCents = (long)(order.TotalAmount * 100);

        var vnpayData = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            { "vnp_Version", version },
            { "vnp_Command", command },
            { "vnp_TmnCode", tmnCode! },
            { "vnp_Amount", amountInCents.ToString() },
            { "vnp_CreateDate", tick },
            { "vnp_CurrCode", currCode },
            { "vnp_IpAddr", GetIpAddress(httpContext) },
            { "vnp_Locale", locale },
            { "vnp_OrderInfo", $"Thanh toan don hang #{order.Id} tai HITU MARKET" },
            { "vnp_OrderType", "other" },
            { "vnp_ReturnUrl", returnUrl! },
            { "vnp_TxnRef", txnRef },
            { "vnp_ExpireDate", timeNow.AddMinutes(15).ToString("yyyyMMddHHmmss") }
        };

        var hashData = new StringBuilder();
        var query = new StringBuilder();

        foreach (var kv in vnpayData)
        {
            if (!string.IsNullOrEmpty(kv.Value))
            {
                hashData.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
                query.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
            }
        }

        string rawHashData = hashData.ToString().TrimEnd('&');
        string secureHash = HmacSha512(hashSecret!, rawHashData);

        query.Append("vnp_SecureHash=" + secureHash);

        return $"{baseUrl}?{query}";
    }

    public bool ValidateSignature(IQueryCollection query)
    {
        var hashSecret = _configuration["VnPay:HashSecret"];
        if (string.IsNullOrEmpty(hashSecret)) return false;

        var vnpayData = new SortedDictionary<string, string>(StringComparer.Ordinal);
        string vnp_SecureHash = string.Empty;

        foreach (var (key, value) in query)
        {
            if (!string.IsNullOrEmpty(key) && !string.IsNullOrEmpty(value))
            {
                if (key.Equals("vnp_SecureHash", StringComparison.OrdinalIgnoreCase))
                {
                    vnp_SecureHash = value.ToString();
                }
                else if (!key.Equals("vnp_SecureHashType", StringComparison.OrdinalIgnoreCase))
                {
                    vnpayData.Add(key, value.ToString());
                }
            }
        }

        var hashData = new StringBuilder();
        foreach (var kv in vnpayData)
        {
            if (!string.IsNullOrEmpty(kv.Value))
            {
                hashData.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
            }
        }

        string rawHashData = hashData.ToString().TrimEnd('&');
        string myChecksum = HmacSha512(hashSecret, rawHashData);

        return myChecksum.Equals(vnp_SecureHash, StringComparison.OrdinalIgnoreCase);
    }

    public PaymentResponseDto ProcessCallback(IQueryCollection query)
    {
        bool isValid = ValidateSignature(query);
        var vnp_ResponseCode = query["vnp_ResponseCode"].ToString();
        var vnp_TxnRef = query["vnp_TxnRef"].ToString();
        var vnp_TransactionNo = query["vnp_TransactionNo"].ToString();
        var vnp_OrderInfo = query["vnp_OrderInfo"].ToString();
        var vnp_AmountStr = query["vnp_Amount"].ToString();

        decimal amount = 0;
        if (decimal.TryParse(vnp_AmountStr, out var rawAmount))
        {
            amount = rawAmount / 100;
        }

        bool success = isValid && vnp_ResponseCode == "00";
        string message = vnp_ResponseCode switch
        {
            "00" => "Giao dịch thành công.",
            "07" => "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
            "09" => "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking.",
            "10" => "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.",
            "11" => "Đã hết hạn chờ thanh toán.",
            "12" => "Thẻ/Tài khoản bị khóa.",
            "24" => "Khách hàng hủy giao dịch.",
            "51" => "Tài khoản không đủ số dư.",
            "65" => "Tài khoản đã vượt quá hạn mức giao dịch trong ngày.",
            "75" => "Ngân hàng thanh toán đang bảo trì.",
            "79" => "Nhập sai mật khẩu thanh toán quá số lần quy định.",
            _ => "Thanh toán không thành công."
        };

        if (!isValid) message = "Chữ ký VNPay không hợp lệ (Checksum failed).";

        return new PaymentResponseDto
        {
            Success = success,
            TxnRef = vnp_TxnRef,
            VnPayTransactionNo = vnp_TransactionNo,
            ResponseCode = vnp_ResponseCode,
            OrderInfo = vnp_OrderInfo,
            Amount = amount,
            Message = message
        };
    }

    private static string GetIpAddress(HttpContext context)
    {
        var ipAddress = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (string.IsNullOrEmpty(ipAddress))
        {
            ipAddress = context.Connection.RemoteIpAddress?.ToString();
        }
        if (string.IsNullOrEmpty(ipAddress) || ipAddress == "::1")
        {
            ipAddress = "127.0.0.1";
        }
        return ipAddress;
    }

    private static string HmacSha512(string key, string inputData)
    {
        var hash = new StringBuilder();
        byte[] keyBytes = Encoding.UTF8.GetBytes(key);
        byte[] inputBytes = Encoding.UTF8.GetBytes(inputData);

        using (var hmac = new HMACSHA512(keyBytes))
        {
            byte[] hashValue = hmac.ComputeHash(inputBytes);
            foreach (byte theByte in hashValue)
            {
                hash.Append(theByte.ToString("x2"));
            }
        }
        return hash.ToString();
    }
}
