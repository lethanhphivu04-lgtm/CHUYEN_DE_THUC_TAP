using System;

namespace Marketplace.Core.Entities;

/// <summary>
/// Trạng thái của yêu cầu trả hàng / hoàn tiền
/// </summary>
public enum ReturnStatus
{
    /// <summary> Đang chờ xử lý (chờ duyệt) </summary>
    Pending = 0,

    /// <summary> Đã chấp nhận yêu cầu trả hàng / hoàn tiền </summary>
    Approved = 1,

    /// <summary> Từ chối yêu cầu trả hàng / hoàn tiền </summary>
    Rejected = 2
}

/// <summary>
/// Bảng lưu thông tin yêu cầu Trả hàng / Hoàn tiền từ khách hàng
/// </summary>
public class ReturnRequest
{
    /// <summary> Mã định danh duy nhất của yêu cầu trả hàng (Khóa chính) </summary>
    public int Id { get; set; }

    /// <summary> Mã đơn hàng con tương ứng cần yêu cầu trả hàng (Khóa ngoại) </summary>
    public int SubOrderId { get; set; }

    /// <summary> Mã người dùng (khách hàng) gửi yêu cầu trả hàng (Khóa ngoại) </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary> Lý do khách hàng muốn trả hàng / hoàn tiền </summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary> Số tiền đề nghị hoàn lại cho khách hàng </summary>
    public decimal RefundAmount { get; set; }

    /// <summary> Trạng thái hiện tại của yêu cầu (Mặc định: Pending - Chờ xử lý) </summary>
    public ReturnStatus Status { get; set; } = ReturnStatus.Pending;

    /// <summary> Ghi chú hoặc phản hồi từ Quản trị viên (Admin/Seller) khi xử lý yêu cầu </summary>
    public string? AdminNote { get; set; }

    /// <summary> Thời gian gửi yêu cầu trả hàng (tính theo giờ UTC) </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary> Thời gian Admin/Seller duyệt hoặc từ chối yêu cầu </summary>
    public DateTime? ProcessedAt { get; set; }

    #region Navigation Properties (Quan hệ đối tượng)
    /// <summary> Thông tin Đơn hàng con liên kết </summary>
    public SubOrder? SubOrder { get; set; }

    /// <summary> Thông tin Người dùng liên kết </summary>
    public ApplicationUser? User { get; set; }
    #endregion
}
