using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Marketplace.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Marketplace.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        await context.Database.MigrateAsync();
        await EnsureCartAndOrderTablesExistAsync(context);

        // 1. Seed Roles
        string[] roles = ["Admin", "Seller", "Member", "Guest"];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // 2. Seed Admin User
        var adminEmails = new[] { "admin@gmail.com", "admin@marketplace.vn" };
        foreach (var adminEmail in adminEmails)
        {
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    FullName = "Hệ Thống Admin",
                    EmailConfirmed = true
                };
                await userManager.CreateAsync(adminUser, "Admin123!");
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }

        // 3. Seed Customer User
        var customerEmail = "customer@gmail.com";
        var customerUser = await userManager.FindByEmailAsync(customerEmail);
        if (customerUser == null)
        {
            customerUser = new ApplicationUser
            {
                UserName = customerEmail,
                Email = customerEmail,
                FullName = "Nguyễn Văn Khách",
                EmailConfirmed = true
            };
            await userManager.CreateAsync(customerUser, "Member123!");
        }

        // Seed addresses for customerUser
        if (customerUser != null)
        {
            var hasAddresses = await context.Addresses.AnyAsync(a => a.UserId == customerUser.Id);
            if (!hasAddresses)
            {
                var addresses = new List<Address>
                {
                    new Address
                    {
                        UserId = customerUser.Id,
                        ReceiverName = "Nguyễn Văn Khách",
                        Phone = "0901234567",
                        StreetAddress = "Feliz Homes - Tòa Zen, Ngõ 279 Đường Hoàng Mai",
                        Ward = "Phường Hoàng Văn Thụ",
                        District = "Quận Hoàng Mai",
                        City = "Thành phố Hà Nội",
                        IsDefault = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Address
                    {
                        UserId = customerUser.Id,
                        ReceiverName = "Nguyễn Văn Khách (Văn phòng)",
                        Phone = "0987654321",
                        StreetAddress = "Tòa nhà Keangnam Landmark 72, Đường Phạm Hùng",
                        Ward = "Phường Mễ Trì",
                        District = "Quận Nam Từ Liêm",
                        City = "Thành phố Hà Nội",
                        IsDefault = false,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Address
                    {
                        UserId = customerUser.Id,
                        ReceiverName = "Nguyễn Văn Khách (Nhà riêng Đà Nẵng)",
                        Phone = "0911223344",
                        StreetAddress = "Lô 12-14 Đường Võ Nguyên Giáp",
                        Ward = "Phường Phước Mỹ",
                        District = "Quận Sơn Trà",
                        City = "Thành phố Đà Nẵng",
                        IsDefault = false,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Address
                    {
                        UserId = customerUser.Id,
                        ReceiverName = "Nguyễn Văn Khách (Chi nhánh HCM)",
                        Phone = "0933445566",
                        StreetAddress = "Số 15 Lê Lợi, Bến Nghé",
                        Ward = "Phường Bến Nghé",
                        District = "Quận 1",
                        City = "Thành phố Hồ Chí Minh",
                        IsDefault = false,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Address
                    {
                        UserId = customerUser.Id,
                        ReceiverName = "Nguyễn Văn Khách (Quê quán)",
                        Phone = "0944556677",
                        StreetAddress = "Đường Hùng Vương, Xã Cam Hải Tây",
                        Ward = "Xã Cam Hải Tây",
                        District = "Huyện Cam Lâm",
                        City = "Tỉnh Khánh Hòa",
                        IsDefault = false,
                        CreatedAt = DateTime.UtcNow
                    }
                };
                context.Addresses.AddRange(addresses);
                await context.SaveChangesAsync();
            }
        }

        // If categories and many products already exist, skip duplicate seeding
        if (await context.Products.CountAsync() >= 50)
        {
            if (!await context.Products.AnyAsync(p => p.Name == "iPhone 15 Pro Max (Đa Phân Loại)"))
            {
                await SeedMultiSkuProductsAsync(context);
            }
            await SeedHistoricalDataAsync(context, userManager);
            return;
        }

        // Clear existing small sample products/categories if any to refresh clean seed
        if (await context.Products.AnyAsync())
        {
            context.ProductSkus.RemoveRange(context.ProductSkus);
            context.ProductImages.RemoveRange(context.ProductImages);
            context.Products.RemoveRange(context.Products);
            await context.SaveChangesAsync();
        }

        if (await context.Categories.CountAsync() < 6)
        {
            if (await context.Products.AnyAsync())
            {
                context.ProductSkus.RemoveRange(context.ProductSkus);
                context.ProductImages.RemoveRange(context.ProductImages);
                context.Products.RemoveRange(context.Products);
            }
            context.Categories.RemoveRange(context.Categories);
            await context.SaveChangesAsync();

            var catList = new List<Category>
            {
                new Category { Name = "Điện Thoại & Máy Tính", Description = "Thiết bị công nghệ chính hãng, điện thoại, laptop, linh kiện" },
                new Category { Name = "Thời Trang & Phụ Kiện", Description = "Thời trang nam nữ, phong cách trẻ trung hiện đại" },
                new Category { Name = "Nhà Cửa & Đời Sống", Description = "Đồ gia dụng, thiết bị thông minh cho gia đình" },
                new Category { Name = "Sức Khỏe & Sắc Đẹp", Description = "Mỹ phẩm chăm sóc da, son môi, thực phẩm chức năng" },
                new Category { Name = "Thể Thao & Dã Ngoại", Description = "Dụng cụ thể thao, giày chạy bộ, trang phục dã ngoại" },
                new Category { Name = "Nội Thất & Trang Trí", Description = "Nội thất văn phòng, bàn ghế công thái học, đồ decor" }
            };
            context.Categories.AddRange(catList);
            await context.SaveChangesAsync();
        }

        var categories = await context.Categories.ToListAsync();
        var catTech = categories.FirstOrDefault(c => c.Name.Contains("Điện Thoại")) ?? categories[0];
        var catFashion = categories.FirstOrDefault(c => c.Name.Contains("Thời Trang")) ?? categories[0];
        var catHome = categories.FirstOrDefault(c => c.Name.Contains("Nhà Cửa")) ?? categories[0];
        var catBeauty = categories.FirstOrDefault(c => c.Name.Contains("Sức Khỏe")) ?? categories[0];
        var catSport = categories.FirstOrDefault(c => c.Name.Contains("Thể Thao")) ?? categories[0];
        var catFurniture = categories.FirstOrDefault(c => c.Name.Contains("Nội Thất")) ?? categories[0];

        // 4. Seed 6 Sellers
        var sellerConfigs = new[]
        {
            new { Email = "seller1@gmail.com", Name = "Lê Hoàng Nam", Shop = "HITU Official Store", Desc = "Cửa hàng công nghệ hàng đầu phân phối điện thoại & laptop chính hãng." },
            new { Email = "seller2@gmail.com", Name = "Trần Thị Mai", Shop = "Phong Cách Viet Fashion", Desc = "Chuyên thiết kế và phân phối thời trang Nam Nữ đón đầu xu hướng." },
            new { Email = "seller3@gmail.com", Name = "Nguyễn Văn Đức", Shop = "Gia Dụng Xanh SmartHome", Desc = "Giải pháp đồ gia dụng thông minh và thiết bị tiện ích cho ngôi nhà bạn." },
            new { Email = "seller4@gmail.com", Name = "Phạm Thu Thảo", Shop = "Beauty & Care Official", Desc = "Mỹ phẩm chính hãng cao cấp, son môi và kem chăm sóc da an toàn." },
            new { Email = "seller5@gmail.com", Name = "Vũ Anh Tuấn", Shop = "SportLife Việt Nam", Desc = "Trang phục dụng cụ thể thao chuyên nghiệp và phụ kiện dã ngoại." },
            new { Email = "seller6@gmail.com", Name = "Đặng Minh Trí", Shop = "Nội Thất Space Store", Desc = "Nội thất hiện đại, ghế công thái học và không gian sống tối giản." }
        };

        var sellerEntities = new List<Seller>();

        foreach (var cfg in sellerConfigs)
        {
            var user = await userManager.FindByEmailAsync(cfg.Email);
            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = cfg.Email,
                    Email = cfg.Email,
                    FullName = cfg.Name,
                    IsSeller = true,
                    EmailConfirmed = true
                };
                await userManager.CreateAsync(user, "Seller123!");
                await userManager.AddToRoleAsync(user, "Seller");
            }

            var seller = await context.Sellers.FirstOrDefaultAsync(s => s.UserId == user.Id);
            if (seller == null)
            {
                seller = new Seller
                {
                    UserId = user.Id,
                    ShopName = cfg.Shop,
                    Description = cfg.Desc,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Sellers.Add(seller);
                await context.SaveChangesAsync();
            }
            sellerEntities.Add(seller);
        }

        // Helper for adding products
        void AddProd(Seller s, Category c, string name, string desc, string img, decimal price, int stock, string size, string color)
        {
            var p = new Product
            {
                Name = name,
                Description = desc,
                CategoryId = c.Id,
                SellerId = s.Id,
                CreatedAt = DateTime.UtcNow
            };
            
            // Add original SKU
            var skuCode = $"{s.Id}-{c.Id}-{Guid.NewGuid().ToString()[..6].ToUpper()}";
            p.Skus.Add(new ProductSku { SkuCode = skuCode, Price = price, StockQuantity = stock, Size = size, Color = color });

            // Automatically generate 2 additional random variations for EVERY product
            var extraColors = new[] { "Đen", "Trắng", "Xám", "Bạc", "Vàng Hồng", "Xanh Navy", "Đỏ" };
            var extraSizes = new[] { "S", "M", "L", "XL", "256GB", "512GB", "Standard", "Free Size" };
            var rnd = new Random();

            for (int i = 0; i < 2; i++)
            {
                var rColor = extraColors[rnd.Next(extraColors.Length)];
                var rSize = extraSizes[rnd.Next(extraSizes.Length)];
                
                // Ensure no duplicate exact matching sku string
                if (rColor != color || rSize != size)
                {
                    var extraCode = $"{s.Id}-{c.Id}-{Guid.NewGuid().ToString()[..6].ToUpper()}";
                    // slight price difference
                    decimal extraPrice = price + (rnd.Next(1, 10) * 50000);
                    p.Skus.Add(new ProductSku { SkuCode = extraCode, Price = extraPrice, StockQuantity = rnd.Next(5, 50), Size = rSize, Color = rColor });
                }
            }

            p.Images.Add(new ProductImage { ImageUrl = img, IsMain = true });
            context.Products.Add(p);
        }

        // Shop 1: HITU Official Store (Tech) - 12 Products
        var s1 = sellerEntities[0];
        AddProd(s1, catTech, "iPhone 15 Pro Max 256GB", "Khung titan siêu nhẹ, chip A17 Pro mạnh mẽ, camera zoom 5x.", "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=600", 29990000, 20, "256GB", "Titan Tự Nhiên");
        AddProd(s1, catTech, "MacBook Air M3 13 inch 16GB", "Thiết kế mỏng nhẹ đẳng cấp, màn hình Retina sắc nét.", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600", 32990000, 15, "16GB/512GB", "Xám Không Gian");
        AddProd(s1, catTech, "Tai nghe Apple AirPods Pro 2", "Chống ồn chủ động ANC cải tiến, thời lượng pin 30 giờ.", "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?q=80&w=600", 5990000, 35, "Standard", "Trắng");
        AddProd(s1, catTech, "Đồng hồ Samsung Galaxy Watch 6", "Theo dõi sức khỏe toàn diện, đo điện tâm đồ và nhịp tim.", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600", 6490000, 18, "44mm", "Đen");
        AddProd(s1, catTech, "Bàn phím cơ không dây Keychron K2", "Switch Gateron gõ êm ái, kết nối Bluetooth 5.1 đa thiết bị.", "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=600", 1850000, 40, "75%", "RGB / Brown Switch");
        AddProd(s1, catTech, "Chuột không dây Logitech MX Master 3S", "Cuộn cuộn MagSpeed siêu nhanh, cảm biến 8000 DPI mọi bề mặt.", "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=600", 2490000, 25, "Standard", "Graphite");
        AddProd(s1, catTech, "Màn hình Dell UltraSharp 27 inch 4K", "Tấm nền IPS độ phủ màu 99% sRGB, kết nối USB-C tiện lợi.", "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600", 11490000, 12, "27 inch", "Bạc Titan");
        AddProd(s1, catTech, "Loa Bluetooth JBL Charge 5", "Âm thanh JBL Original Pro mạnh mẽ, chống nước bụi chuẩn IP67.", "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=600", 3890000, 30, "Standard", "Xanh Camo");
        AddProd(s1, catTech, "Máy tính bảng iPad Air 5 64GB", "Chip Apple M1 hiệu năng vượt trội, hỗ trợ Apple Pencil 2.", "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600", 14890000, 22, "64GB", "Xanh Băng");
        AddProd(s1, catTech, "Sạc dự phòng Anker MagGo 10000mAh", "Sạc không dây Magsafe tiện lợi, tích hợp chân chống thông minh.", "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?q=80&w=600", 1290000, 50, "10000mAh", "Đen Tuyền");
        AddProd(s1, catTech, "Webcam Logitech C920 HD Pro", "Độ phân giải Full HD 1080p, micro kép lọc tiếng ồn chuẩn xác.", "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?q=80&w=600", 1690000, 28, "1080p", "Đen");
        AddProd(s1, catTech, "Ổ cứng SSD Portable Samsung T7 1TB", "Tốc độ đọc ghi lên tới 1050MB/s, thiết kế vỏ nhôm bền bỉ.", "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=600", 2590000, 45, "1TB", "Xanh Đậm");

        // Shop 2: Phong Cách Viet Fashion - 12 Products
        var s2 = sellerEntities[1];
        AddProd(s2, catFashion, "Áo Khoác Bomber Kaki Unisex", "Chất liệu kaki 2 lớp dày dặn, phom rộng phong cách Streetwear.", "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600", 350000, 60, "Size L", "Đen Rêu");
        AddProd(s2, catFashion, "Áo Phông Oversize Cotton 100%", "Vải cotton 250gsm thấm hút mồ hôi, co giãn 4 chiều mềm mại.", "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600", 199000, 100, "Size M/L", "Trắng Tinh");
        AddProd(s2, catFashion, "Quần Jeans Nam Phom Slimfit", "Chất jeans co giãn nhẹ, tôn dáng trẻ trung cá tính.", "https://images.unsplash.com/photo-1542272604-780c36856842?q=80&w=600", 420000, 45, "Size 31", "Xanh Chàm");
        AddProd(s2, catFashion, "Váy Dài Nữ Dáng Xòe Vintage", "Thiết kế nữ tính thắt eo nhẹ nhàng, chất liệu voan lụa cao cấp.", "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=600", 480000, 30, "Free Size", "Hồng Pastel");
        AddProd(s2, catFashion, "Giày Sneaker Nam Nữ Unisex White", "Đế cao su lưu hóa êm chân, phối đồ dễ dàng cho mọi trang phục.", "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600", 590000, 50, "Size 40", "Trắng Sữa");
        AddProd(s2, catFashion, "Áo Sơ Mi Lụa Cổ V Nữ", "Phong cách công sở thanh lịch, chất vải chống nhăn thoáng mát.", "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?q=80&w=600", 299000, 40, "Size S/M", "Kem Kem");
        AddProd(s2, catFashion, "Áo Hoodie Fleece Nỉ Ngoại", "Mũ trùm 2 lớp ấm áp, túi bụng tiện lợi cho thời tiết thu đông.", "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=600", 399000, 35, "XL", "Xám Tiêu");
        AddProd(s2, catFashion, "Túi Xách Nữ Da PU Cao Cấp", "Quai đeo chéo kim loại mạ vàng, ngăn chứa rộng rãi tiện lợi.", "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600", 350000, 25, "Medium", "Đen Nâu");
        AddProd(s2, catFashion, "Mũ Nón Kếnt Baseball Cap", "Chất liệu thô thoáng khí, khóa kim loại sau gáy dễ điều chỉnh.", "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=600", 120000, 80, "Free Size", "Xanh Navy");
        AddProd(s2, catFashion, "Kính Mắt Râm Phong Cách Retro", "Tròng kính chống tia UV400 bảo vệ mắt hoàn hảo dưới ánh nắng.", "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=600", 185000, 60, "Standard", "Gọng Đen");
        AddProd(s2, catFashion, "Quần Short Kaki Nam Năng Động", "Chiều dài ngang gối lịch sự, túi hộp tiện dụng đi chơi dạo phố.", "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=600", 250000, 55, "Size L", "Vàng Cát");
        AddProd(s2, catFashion, "Áo Blazer Nam Form Rộng Hàn Quốc", "Thiết kế đệm vai nhẹ, phong cách lịch lãm hiện đại.", "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600", 750000, 20, "Size XL", "Đen Lịch Lãm");

        // Shop 3: Gia Dụng Xanh SmartHome - 12 Products
        var s3 = sellerEntities[2];
        AddProd(s3, catHome, "Nồi Chiên Không Dầu Philips 6.2L", "Công nghệ Rapid Air chiên nướng giòn ngon giảm 90% dầu mỡ.", "https://images.unsplash.com/photo-1585515320310-259814833e62?q=80&w=600", 2890000, 20, "6.2 Lít", "Đen Bóng");
        AddProd(s3, catHome, "Robot Hút Bụi Lau Nhà Xiaomi Vacuum X10", "Lực hút 4000Pa mạnh mẽ, lập bản đồ laser LDS chính xác.", "https://images.unsplash.com/photo-1625842268584-8f3296236761?q=80&w=600", 7490000, 15, "Standard", "Trắng");
        AddProd(s3, catHome, "Máy Xay Sinh Tố Lock&Lock 1.5L", "Lưỡi dao inox 304 siêu bền, xay đá viên nhanh chóng mượt mà.", "https://images.unsplash.com/photo-1570222094114-d054a817e56b?q=80&w=600", 890000, 30, "1.5 Lít", "Xanh Bạc Hà");
        AddProd(s3, catHome, "Đèn Học Chống Cận Bàn Xiaomi LED", "Ánh sáng chuẩn RG0 bảo vệ thị lực, chỉnh độ sáng cảm ứng.", "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?q=80&w=600", 450000, 50, "LED 10W", "Trắng");
        AddProd(s3, catHome, "Bộ Nồi Inox 5 Đáy Sunhouse 3 Món", "Đáy từ dùng được cho mọi loại bếp, vung kính chịu lực viền viền.", "https://images.unsplash.com/photo-1584992236310-6edddc08acff?q=80&w=600", 950000, 25, "16-20-24cm", "Bạc Inox");
        AddProd(s3, catHome, "Ấm Đun Nước Siêu Tốc Tefal 1.7L", "Thân ấm 2 lớp chống nóng an toàn, tự ngắt khi nước sôi.", "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f6?q=80&w=600", 690000, 40, "1.7 Lít", "Đỏ Đô");
        AddProd(s3, catHome, "Máy Lọc Không Khí Levoit Core 300S", "Màng lọc True HEPA H13 loại bỏ 99.97% bụi mịn PM2.5.", "https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=600", 3290000, 18, "Phòng 41m2", "Trắng");
        AddProd(s3, catHome, "Bình Giữ Nhiệt Thermos 750ml", "Giữ nóng lạnh lên tới 24h, chất liệu thép không gỉ 316 an toàn.", "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=600", 550000, 60, "750ml", "Màu Titan");
        AddProd(s3, catHome, "Máy Ép Chậm Nước Hoa Quả Panasonic", "Ép kiệt bã tối đa, giữ trọn vẹn vitamin và dưỡng chất tươi ngon.", "https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=600", 2190000, 22, "150W", "Đen Kim Loại");
        AddProd(s3, catHome, "Bộ Chăn Drap Gối Cotton Tencel 4 Món", "Vải tencel mát mịn như lụa, thấm hút mồ hôi tốt không xù lông.", "https://images.unsplash.com/photo-1616627547584-bf28cee262db?q=80&w=600", 1250000, 15, "King Size 1m8", "Xanh Xám");
        AddProd(s3, catHome, "Bàn Ủi Hơi Nước Cầm Tay Philips", "Công suất 1300W phun hơi liên tục, ủi phẳng quần áo treo tiện lợi.", "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?q=80&w=600", 790000, 35, "Compact", "Hồng Tím");
        AddProd(s3, catHome, "Cân Sức Khỏe Điện Tử Smart Scale", "Kết nối ứng dụng điện thoại đo 13 chỉ số cơ thể thông minh.", "https://images.unsplash.com/photo-1576243345690-4e4b79b63288?q=80&w=600", 299000, 70, "Max 180kg", "Kính Cường Lực");

        // Shop 4: Beauty & Care Official - 12 Products
        var s4 = sellerEntities[3];
        AddProd(s4, catBeauty, "Kem Chống Nắng La Roche-Posay Anthelios 50ml", "Kiểm soát dầu nhờn 12h, chống tia UVA/UVB phổ rộng hoàn hảo.", "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600", 425000, 50, "50ml", "Chất Gel Fluid");
        AddProd(s4, catBeauty, "Son Môi Lì MAC Matte Lipstick 3g", "Màu đỏ thuần quyến rũ, chất son mịn mượt lâu trôi suốt 8 tiếng.", "https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=600", 540000, 40, "3g", "Ruby Woo");
        AddProd(s4, catBeauty, "Nước Tẩy Trang Bioderma Sensibio H2O 500ml", "Dịu nhẹ cho da nhạy cảm, làm sạch sâu lớp trang điểm bụi bẩn.", "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600", 390000, 60, "500ml", "Nắp Hồng");
        AddProd(s4, catBeauty, "Serum Dưỡng Ẩm Estee Lauder Advanced Night Repair", "Phục hồi da lão hóa ban đêm, làm mờ nếp nhăn và sáng mịn da.", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600", 2450000, 25, "50ml", "Chai Thủy Tinh");
        AddProd(s4, catBeauty, "Sữa Rửa Mặt CeraVe Foaming Facial Cleanser", "Bổ sung Ceramides và Hyaluronic Acid bảo vệ hàng rào độ ẩm da.", "https://images.unsplash.com/photo-1556228722-d1191e3e707d?q=80&w=600", 370000, 55, "473ml", "Da Dầu Mụn");
        AddProd(s4, catBeauty, "Kem Dưỡng Da B5 Paula's Choice Clinical 50ml", "Phục hồi da tổn thương siêu tốc, giảm mẩn đỏ kiềm dầu hiệu quả.", "https://images.unsplash.com/photo-1608248597261-e4d0450cbf1c?q=80&w=600", 1150000, 20, "50ml", "Tuýp Tím");
        AddProd(s4, catBeauty, "Mặt Nạ Giấy Dưỡng Sáng Skin1004 Rau Má", "Chiết xuất rau má Madagascar làm dịu da cấp ẩm tức thì.", "https://images.unsplash.com/photo-1567928256564-9037c7f3e8f8?q=80&w=600", 35000, 200, "Hộp 10 Miếng", "Chiết Xuất Thiên Nhiên");
        AddProd(s4, catBeauty, "Nước Hoa Nữ Dior Miss Dior EDP 50ml", "Hương hoa cỏ phương đông quyến rũ, thanh lịch và lãng mạn.", "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=600", 3150000, 15, "50ml", "Chai Nơ Nữ Tính");
        AddProd(s4, catBeauty, "Dầu Gội Xả Moroccanoil Smooth 500ml", "Tinh dầu Argan dưỡng tóc suôn mượt vào nếp không gây bết dính.", "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=600", 1350000, 30, "Combo 500ml", "Mùi Thơm Đặc Trưng");
        AddProd(s4, catBeauty, "Phấn Phủ Bột Chống Dầu Innisfree No-Sebum", "Hạt phấn siêu nhỏ kiềm dầu cả ngày cho làn da trong suốt mịn màng.", "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600", 130000, 90, "5g", "Xanh Bạc Hà");
        AddProd(s4, catBeauty, "Máy Rửa Mặt Foreo Luna 3", "Sóng âm T-Sonic làm sạch 99.5% bụi bẩn và tế bào chết tích tụ.", "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600", 3490000, 12, "Da Thường", "Hồng Nhạt");
        AddProd(s4, catBeauty, "Toner Hoa Cúc Kiehl's Calendula 250ml", "Làm dịu da mụn da nhạy cảm, cân bằng độ pH tự nhiên cho da.", "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600", 1080000, 25, "250ml", "Cánh Hoa Cúc");

        // Shop 5: SportLife Việt Nam - 12 Products
        var s5 = sellerEntities[4];
        AddProd(s5, catSport, "Giày Chạy Bộ Nike Pegasus 40", "Đệm Air Zoom êm ái, bám đường cực tốt cho runner mọi cự ly.", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600", 3290000, 30, "Size 42", "Đỏ Đen");
        AddProd(s5, catSport, "Thảm Tập Yoga TPE 2 Lớp 8mm", "Chất liệu TPE sinh học chống trơn trượt tuyệt đối, tặng kèm dây đeo.", "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?q=80&w=600", 320000, 60, "8mm 183x61cm", "Tím Nhạt");
        AddProd(s5, catSport, "Bóng Đá Molten Chuẩn Thi Đấu V-League", "Da PU cao cấp khâu tay tỉ mỉ, độ nẩy chuẩn xác đạt tiêu chuẩn FIFA.", "https://images.unsplash.com/photo-1614632537197-38a17061c2bd?q=80&w=600", 650000, 40, "Size 5", "Trắng Xanh");
        AddProd(s5, catSport, "Áo Tập Gym Nam Co Giãn Dry-Fit", "Chất thun lạnh 4 chiều ôm body tôn cơ bắp, thoáng khí siêu nhanh.", "https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=600", 180000, 80, "Size L", "Đen Xám");
        AddProd(s5, catSport, "Vợt Cầu Lông Yonex Astrox 88D Pro", "Công nghệ Rotational Generator System cho cú đập cầu uy lực.", "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600", 3850000, 15, "4U - G5", "Vàng Đen");
        AddProd(s5, catSport, "Lều Cắm Trại Tự Bung 4 Người Naturehike", "Chống nước mưa PU3000mm, mở lều nhanh chóng trong 3 giây.", "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=600", 1450000, 20, "2m x 2m", "Xanh Rêu");
        AddProd(s5, catSport, "Bình Nước Thể Thao BPI Gym 2.2L", "Dung tích cực đại chứa đủ nước cho buổi tập, nhựa BPA Free an toàn.", "https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?q=80&w=600", 160000, 100, "2.2 Lít", "Đen Trong");
        AddProd(s5, catSport, "Băng Gối Bảo Vệ Khớp Khi Tập Nặng", "Đệm lò xo 2 bên giảm chấn thương dây chằng khi squat chạy bộ.", "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600", 195000, 70, "Free Size", "Đen Viền Đỏ");
        AddProd(s5, catSport, "Kính Bơi Chống Đọng Sương Arena", "Tròng tráng gương chống tia UV, viền silicon êm ái không vô nước.", "https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=600", 490000, 35, "Adult", "Tráng Gương Bạc");
        AddProd(s5, catSport, "Túi Du Lịch Thể Thao Đa Năng Có Ngăn Giày", "Chống nước nhẹ, có ngăn riêng để giày bẩn và quần áo ướt.", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600", 280000, 50, "Capacity 35L", "Đen Xám");
        AddProd(s5, catSport, "Đồng Hồ Thể Thao Garmin Forerunner 265", "Màn hình AMOLED rực rỡ, GPS tần số đôi chuẩn xác cho runner.", "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=600", 11690000, 10, "46mm", "Đen Vàng Aqua");
        AddProd(s5, catSport, "Dây Kháng Lực Tập Mông Đùi Fabric Band", "Chất liệu dệt sợi cao su co giãn không lo xoắn cuộn khi tập.", "https://images.unsplash.com/photo-1598289431512-b97b0917affc?q=80&w=600", 150000, 90, "Set 3 Mức Độ", "Hồng Xanh Đen");

        // Shop 6: Nội Thất Space Store - 12 Products
        var s6 = sellerEntities[5];
        AddProd(s6, catFurniture, "Ghế Công Thái Học Ergonomic Sihoo M57", "Lưới GTR thoáng khí, đệm thắt lưng tự điều chỉnh nâng đỡ cột sống.", "https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?q=80&w=600", 3890000, 25, "Full Mesh", "Xám Đen");
        AddProd(s6, catFurniture, "Bàn Làm Việc Nâng Hạ Độ Cao SmartDesk", "Động cơ đôi nâng hạ êm ái, mặt bàn gỗ MDF phủ Melamine chống xước.", "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=600", 5490000, 15, "140x70cm", "Mặt Gỗ Chân Đen");
        AddProd(s6, catFurniture, "Đèn Đọc Sách Đặt Sàn Minimalist Scandinavian", "Thân kim loại sơn tĩnh điện, chao đèn góc quay 360 độ linh hoạt.", "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=600", 680000, 30, "Cao 1m6", "Trắng Tối Giản");
        AddProd(s6, catFurniture, "Ghế Sofa Đơn Bọc Vải Nhung Retro", "Đệm mút D40 độ đàn hồi cao, chân gỗ tự nhiên chắc chắn sang trọng.", "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600", 2450000, 12, "Single Chair", "Xanh Rêu Classic");
        AddProd(s6, catFurniture, "Kệ Sách Gỗ 5 Tầng Trang Trí Phòng Khách", "Thiết kế mỏng gọn tiết kiệm không gian, chịu lực tốt từng tầng.", "https://images.unsplash.com/photo-1594620302200-9a762244a156?q=80&w=600", 850000, 20, "150x60cm", "Gỗ Sồi Tự Nhiên");
        AddProd(s6, catFurniture, "Gương Soi Toàn Thân Vòm Cong Khung Kim Loại", "Kính tráng bạc 5mm nét căng không biến dạng hình ảnh, có chân tựa.", "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600", 1150000, 18, "160x50cm", "Viền Vàng Đồng");
        AddProd(s6, catFurniture, "Bàn Trà Tròn Mặt Đá Sintered Stone", "Mặt đá chống xước ố nhiệt độ cao, chân kim loại mạ Titan bóng đẹp.", "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=600", 1950000, 15, "Đường Kính 70cm", "Trắng Vân Mây");
        AddProd(s6, catFurniture, "Đồng Hồ Treo Tường Nghệ Thuật 3D Minimalist", "Máy kim trôi không tiếng động, đường nét hiện đại điểm nhấn phòng khách.", "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?q=80&w=600", 420000, 40, "Đường Kính 40cm", "Đen Vàng");
        AddProd(s6, catFurniture, "Cây Đèn LED Góc Tường RGB Điều Khiển App", "16 triệu màu nháy theo nhạc, tạo không gian Decor Gaming chill cực đẹp.", "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=600", 490000, 50, "Cao 1m4", "RGB Smart");
        AddProd(s6, catFurniture, "Thảm Lót Sàn Loang Màu Scandinavian 1m6x2m", "Sợi lông ngắn mềm mịn không bám bụi, mặt sau hạt cao su chống trượt.", "https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=600", 650000, 25, "160x200cm", "Ghi Xám Loang");
        AddProd(s6, catFurniture, "Kệ Treo Quần Áo Khung Thép Đa Năng", "Kết hợp sào treo và 3 tầng kệ để giày dép túi xách tiện lợi.", "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=600", 520000, 35, "120x40x160cm", "Khung Đen Gỗ");
        AddProd(s6, catFurniture, "Gối Đệm Tựa Lưng Văn Phòng Memory Foam", "Mút ruột cao su non nguyên khối nâng đỡ thắt lưng chống mỏi tối đa.", "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=600", 260000, 60, "Standard", "Xám Mịn");

        await context.SaveChangesAsync();
        await SeedHistoricalDataAsync(context, userManager);
    }

    private static async Task EnsureCartAndOrderTablesExistAsync(ApplicationDbContext context)
    {
        var sql = @"
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Carts]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Carts] (
        [Id] int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [UserId] nvarchar(450) NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [FK_Carts_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CartItems]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[CartItems] (
        [Id] int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [CartId] int NOT NULL,
        [ProductSkuId] int NOT NULL,
        [Quantity] int NOT NULL DEFAULT 1,
        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [FK_CartItems_Carts_CartId] FOREIGN KEY ([CartId]) REFERENCES [dbo].[Carts] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_CartItems_ProductSkus_ProductSkuId] FOREIGN KEY ([ProductSkuId]) REFERENCES [dbo].[ProductSkus] ([Id]) ON DELETE NO ACTION
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Orders]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Orders] (
        [Id] int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [UserId] nvarchar(450) NOT NULL,
        [AddressSnapshot] nvarchar(max) NOT NULL DEFAULT '',
        [TotalAmount] decimal(18,2) NOT NULL DEFAULT 0,
        [PaymentMethod] nvarchar(max) NOT NULL DEFAULT 'COD',
        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [FK_Orders_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[AspNetUsers] ([Id]) ON DELETE NO ACTION
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SubOrders]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SubOrders] (
        [Id] int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [OrderId] int NOT NULL,
        [SellerId] int NOT NULL,
        [SubTotal] decimal(18,2) NOT NULL DEFAULT 0,
        [Status] int NOT NULL DEFAULT 0,
        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [FK_SubOrders_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [dbo].[Orders] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_SubOrders_Sellers_SellerId] FOREIGN KEY ([SellerId]) REFERENCES [dbo].[Sellers] ([Id]) ON DELETE NO ACTION
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[OrderItems]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[OrderItems] (
        [Id] int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [SubOrderId] int NOT NULL,
        [ProductSkuId] int NOT NULL,
        [ProductId] int NOT NULL,
        [ProductName] nvarchar(max) NOT NULL DEFAULT '',
        [SkuInfo] nvarchar(max) NULL,
        [PriceSnapshot] decimal(18,2) NOT NULL DEFAULT 0,
        [Quantity] int NOT NULL DEFAULT 1,
        [ImageUrl] nvarchar(max) NULL,
        CONSTRAINT [FK_OrderItems_SubOrders_SubOrderId] FOREIGN KEY ([SubOrderId]) REFERENCES [dbo].[SubOrders] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_OrderItems_ProductSkus_ProductSkuId] FOREIGN KEY ([ProductSkuId]) REFERENCES [dbo].[ProductSkus] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_OrderItems_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Products] ([Id]) ON DELETE NO ACTION
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[OrderStatusHistories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[OrderStatusHistories] (
        [Id] int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [SubOrderId] int NOT NULL,
        [FromStatus] int NOT NULL DEFAULT 0,
        [ToStatus] int NOT NULL DEFAULT 0,
        [Note] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [FK_OrderStatusHistories_SubOrders_SubOrderId] FOREIGN KEY ([SubOrderId]) REFERENCES [dbo].[SubOrders] ([Id]) ON DELETE CASCADE
    );
END";
        await context.Database.ExecuteSqlRawAsync(sql);
    }

    private static async Task SeedMultiSkuProductsAsync(ApplicationDbContext context)
    {
        var sellers = await context.Sellers.Take(2).ToListAsync();
        var catTech = await context.Categories.FirstOrDefaultAsync(c => c.Name.Contains("Điện Thoại"));
        var catFashion = await context.Categories.FirstOrDefaultAsync(c => c.Name.Contains("Thời Trang"));
        
        if (sellers.Count < 2 || catTech == null || catFashion == null) return;

        // Tech Product with variations
        var p1 = new Product
        {
            Name = "iPhone 15 Pro Max (Đa Phân Loại)",
            Description = "Điện thoại thông minh với nhiều tùy chọn bộ nhớ và màu sắc. Chọn đúng phân loại bạn muốn mua.",
            CategoryId = catTech.Id,
            SellerId = sellers[0].Id,
            CreatedAt = DateTime.UtcNow
        };
        p1.Images.Add(new ProductImage { ImageUrl = "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=600", IsMain = true });
        
        var variants1 = new List<(string Size, string Color, decimal Price, int Stock)>
        {
            ("256GB", "Titan Tự Nhiên", 29990000, 10),
            ("256GB", "Titan Trắng", 29990000, 15),
            ("512GB", "Titan Tự Nhiên", 34990000, 5),
            ("512GB", "Titan Trắng", 34990000, 8),
            ("1TB", "Titan Đen", 41990000, 3)
        };

        foreach (var v in variants1)
        {
            p1.Skus.Add(new ProductSku
            {
                SkuCode = $"IP15PM-{v.Size}-{v.Color.Replace(" ", "")}",
                Price = v.Price,
                StockQuantity = v.Stock,
                Size = v.Size,
                Color = v.Color
            });
        }
        context.Products.Add(p1);

        // Fashion Product with variations
        var p2 = new Product
        {
            Name = "Áo Phông Nam Basic (Nhiều Size/Màu)",
            Description = "Áo thun nam chất liệu 100% cotton thoáng mát, form rộng rãi dễ phối đồ.",
            CategoryId = catFashion.Id,
            SellerId = sellers[1].Id,
            CreatedAt = DateTime.UtcNow
        };
        p2.Images.Add(new ProductImage { ImageUrl = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600", IsMain = true });
        
        var variants2 = new List<(string Size, string Color, decimal Price, int Stock)>
        {
            ("Size M", "Trắng", 150000, 50),
            ("Size M", "Đen", 150000, 50),
            ("Size L", "Trắng", 160000, 40),
            ("Size L", "Đen", 160000, 40),
            ("Size XL", "Đen", 170000, 20)
        };

        foreach (var v in variants2)
        {
            p2.Skus.Add(new ProductSku
            {
                SkuCode = $"TSHIRT-{v.Size}-{v.Color}",
                Price = v.Price,
                StockQuantity = v.Stock,
                Size = v.Size,
                Color = v.Color
            });
        }
        context.Products.Add(p2);

        await context.SaveChangesAsync();
    }


    private static async Task SeedHistoricalDataAsync(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        // Avoid duplicating historical data if already seeded
        if (await context.Orders.CountAsync() >= 500)
        {
            return;
        }

        var random = new Random();
        
        // 1. Create 50 fake users (Members)
        var fakeUsers = new List<ApplicationUser>();
        for (int i = 1; i <= 50; i++)
        {
            var email = $"mockuser{i}@gmail.com";
            var user = await userManager.FindByEmailAsync(email);
            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    FullName = $"Khách hàng {i}",
                    EmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-random.Next(300, 365))
                };
                await userManager.CreateAsync(user, "Member123!");
                await userManager.AddToRoleAsync(user, "Member");
                
                context.Addresses.Add(new Address
                {
                    UserId = user.Id,
                    ReceiverName = user.FullName,
                    Phone = "09" + random.Next(10000000, 99999999).ToString(),
                    StreetAddress = $"Số {random.Next(1, 999)} Đường Test",
                    Ward = "Phường 1",
                    District = "Quận 1",
                    City = "Hồ Chí Minh",
                    IsDefault = true,
                    CreatedAt = user.CreatedAt
                });
            }
            fakeUsers.Add(user);
        }
        await context.SaveChangesAsync();

        // 2. Fetch required entities
        var products = await context.Products.Include(p => p.Skus).Include(p => p.Images).ToListAsync();
        if (!products.Any()) return;
        var sellers = await context.Sellers.Include(s => s.Wallet).ToListAsync();
        var usersWithAddresses = await context.Users.Include(u => u.Addresses).Where(u => u.Email.StartsWith("mockuser")).ToListAsync();

        if (!usersWithAddresses.Any()) return;

        // 3. Generate 1000 orders distributed over the last 365 days
        var startDate = DateTime.UtcNow.AddDays(-365);
        for (int i = 1; i <= 1000; i++)
        {
            var user = usersWithAddresses[random.Next(usersWithAddresses.Count)];
            var address = user.Addresses.FirstOrDefault();
            if (address == null) continue;

            // Random date in the last year
            var orderDate = startDate.AddDays(random.NextDouble() * 365).AddHours(random.Next(0, 24));
            
            var order = new Order
            {
                UserId = user.Id,
                AddressSnapshot = System.Text.Json.JsonSerializer.Serialize(new { address.ReceiverName, address.Phone, address.StreetAddress, address.Ward, address.District, address.City }),
                PaymentMethod = random.Next(100) < 30 ? "VNPay" : "COD",
                CreatedAt = orderDate
            };

            int numProducts = random.Next(1, 4); // 1 to 3 products per order
            var selectedProducts = products.OrderBy(x => random.Next()).Take(numProducts).ToList();
            
            var grouped = selectedProducts.GroupBy(p => p.SellerId);
            decimal totalAmount = 0;

            foreach (var group in grouped)
            {
                var seller = sellers.FirstOrDefault(s => s.Id == group.Key);
                if (seller == null) continue;

                var deliveredDate = orderDate.AddDays(random.Next(2, 5));
                var subOrder = new SubOrder
                {
                    SellerId = group.Key,
                    Status = OrderStatus.Delivered,
                    CreatedAt = orderDate,
                    UpdatedAt = deliveredDate
                };

                decimal subTotal = 0;
                foreach (var p in group)
                {
                    var sku = p.Skus.FirstOrDefault();
                    if (sku == null) continue;
                    
                    int qty = random.Next(1, 3);
                    var price = sku.Price;
                    
                    subOrder.Items.Add(new OrderItem
                    {
                        ProductSkuId = sku.Id,
                        ProductId = p.Id,
                        ProductName = p.Name,
                        SkuInfo = sku.Size ?? "Standard",
                        PriceSnapshot = price,
                        Quantity = qty,
                        ImageUrl = p.Images.FirstOrDefault()?.ImageUrl
                    });
                    
                    subTotal += price * qty;
                }
                
                subOrder.SubTotal = subTotal;
                
                // Add Histories
                subOrder.StatusHistories.Add(new OrderStatusHistory { FromStatus = OrderStatus.Pending, ToStatus = OrderStatus.Pending, Note = "Đơn hàng được tạo", CreatedAt = orderDate });
                subOrder.StatusHistories.Add(new OrderStatusHistory { FromStatus = OrderStatus.Pending, ToStatus = OrderStatus.Processing, Note = "Người bán đang chuẩn bị hàng", CreatedAt = orderDate.AddHours(random.Next(1, 12)) });
                subOrder.StatusHistories.Add(new OrderStatusHistory { FromStatus = OrderStatus.Processing, ToStatus = OrderStatus.Shipping, Note = "Đã giao cho ĐVVC", CreatedAt = orderDate.AddDays(1) });
                subOrder.StatusHistories.Add(new OrderStatusHistory { FromStatus = OrderStatus.Shipping, ToStatus = OrderStatus.Delivered, Note = "Giao hàng thành công", CreatedAt = deliveredDate });

                // Update seller wallet
                if (seller.Wallet == null) 
                {
                    seller.Wallet = new SellerWallet { SellerId = seller.Id, Balance = 0, LockedBalance = 0 };
                    context.SellerWallets.Add(seller.Wallet);
                }
                
                seller.Wallet.Balance += subTotal;
                seller.Wallet.UpdatedAt = deliveredDate;
                
                context.WalletTransactions.Add(new WalletTransaction
                {
                    Wallet = seller.Wallet,
                    Amount = subTotal,
                    Type = TransactionType.SaleRevenue,
                    Description = $"Doanh thu từ đơn hàng (Tạo tự động)",
                    CreatedAt = deliveredDate
                });

                order.SubOrders.Add(subOrder);
                totalAmount += subTotal;
            }
            
            order.TotalAmount = totalAmount;
            context.Orders.Add(order);
        }
        await context.SaveChangesAsync();
    }
}
