using System.Text;
using Marketplace.Core.Entities;
using Marketplace.Core.Interfaces;
using Marketplace.Infrastructure.Data;
using Marketplace.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// Add DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// Add Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireUppercase = true;
    options.Password.RequiredLength = 8;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configure JWT Authentication
var jwtSecret = builder.Configuration["JwtSettings:Secret"] ?? "SuperSecretKeyMarketplaceMultiVendorProject2026Net9TokenKey!";
var key = Encoding.ASCII.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddTransient<IEmailService, EmailService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed Default Roles
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await context.Database.MigrateAsync();

    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    string[] roles = ["Admin", "Seller", "Member", "Guest"];
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole(role));
        }
    }

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

    // Seed Admin
    var adminUser = await userManager.FindByEmailAsync("admin@gmail.com");
    if (adminUser == null)
    {
        adminUser = new ApplicationUser
        {
            UserName = "admin@gmail.com",
            Email = "admin@gmail.com",
            FullName = "Hệ Thống Admin",
            EmailConfirmed = true
        };
        await userManager.CreateAsync(adminUser, "Admin123!");
        await userManager.AddToRoleAsync(adminUser, "Admin");
    }

    // Seed Customer/Member
    var customerUser = await userManager.FindByEmailAsync("customer@gmail.com");
    if (customerUser == null)
    {
        customerUser = new ApplicationUser
        {
            UserName = "customer@gmail.com",
            Email = "customer@gmail.com",
            FullName = "Nguyễn Văn Khách",
            EmailConfirmed = true
        };
        await userManager.CreateAsync(customerUser, "Member123!");
        await userManager.AddToRoleAsync(customerUser, "Member");
    }

    // Seed Categories and Products
    if (!await context.Categories.AnyAsync())
    {
        var electronics = new Category { Name = "Điện thoại & Máy tính", Description = "Thiết bị công nghệ chính hãng" };
        var fashion = new Category { Name = "Thời trang & Phụ kiện", Description = "Thời trang nam nữ hiện đại" };
        var home = new Category { Name = "Nhà cửa & Đời sống", Description = "Đồ gia dụng tiện ích" };

        context.Categories.AddRange(electronics, fashion, home);
        await context.SaveChangesAsync();

        // Seed a sample Seller
        var sellerUser = await userManager.FindByEmailAsync("seller@gmail.com");
        if (sellerUser == null)
        {
            sellerUser = new ApplicationUser
            {
                UserName = "seller@gmail.com",
                Email = "seller@gmail.com",
                FullName = "Nguyễn Văn Người Bán",
                IsSeller = true,
                EmailConfirmed = true
            };
            await userManager.CreateAsync(sellerUser, "Seller123!");
            await userManager.AddToRoleAsync(sellerUser, "Seller");
        }

        var seller = await context.Sellers.FirstOrDefaultAsync(s => s.UserId == sellerUser.Id);
        if (seller == null)
        {
            seller = new Seller
            {
                UserId = sellerUser.Id,
                ShopName = "HITU Official Store",
                Description = "Cửa hàng chính hãng phân phối thiết bị và thời trang cao cấp.",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Sellers.Add(seller);
            await context.SaveChangesAsync();
        }

        // Add Electronics Products
        var phone = new Product
        {
            Name = "iPhone 15 Pro Max 256GB",
            Description = "Điện thoại di động iPhone 15 Pro Max cao cấp nhất với khung titan siêu nhẹ, chip A17 Pro mạnh mẽ và camera zoom quang học 5x.",
            CategoryId = electronics.Id,
            SellerId = seller.Id,
            CreatedAt = DateTime.UtcNow
        };
        phone.Skus.Add(new ProductSku { SkuCode = "IP15PM-TITAN", Price = 29990000, StockQuantity = 20, Size = "256GB", Color = "Titan Tự Nhiên" });
        phone.Skus.Add(new ProductSku { SkuCode = "IP15PM-BLUE", Price = 29490000, StockQuantity = 15, Size = "256GB", Color = "Titan Xanh" });
        phone.Images.Add(new ProductImage { ImageUrl = "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=600&auto=format&fit=crop", IsMain = true });

        var laptop = new Product
        {
            Name = "MacBook Air M3 13 inch",
            Description = "Máy tính xách tay MacBook Air M3 mỏng nhẹ đẳng cấp, hiệu năng vượt trội từ Apple Silicon M3 thế hệ mới.",
            CategoryId = electronics.Id,
            SellerId = seller.Id,
            CreatedAt = DateTime.UtcNow
        };
        laptop.Skus.Add(new ProductSku { SkuCode = "MBA-M3-8G-256G", Price = 27990000, StockQuantity = 10, Size = "8GB - 256GB", Color = "Xám Không Gian" });
        laptop.Skus.Add(new ProductSku { SkuCode = "MBA-M3-16G-512G", Price = 32990000, StockQuantity = 8, Size = "16GB - 512GB", Color = "Bạc" });
        laptop.Images.Add(new ProductImage { ImageUrl = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600&auto=format&fit=crop", IsMain = true });

        // Add Fashion Products
        var jacket = new Product
        {
            Name = "Áo Khoác Bomber Kaki Unisex",
            Description = "Áo khoác bomber chất liệu kaki 2 lớp cao cấp, phom dáng rộng unisex cá tính phù hợp cả nam và nữ.",
            CategoryId = fashion.Id,
            SellerId = seller.Id,
            CreatedAt = DateTime.UtcNow
        };
        jacket.Skus.Add(new ProductSku { SkuCode = "BM-BLK-L", Price = 350000, StockQuantity = 50, Size = "L", Color = "Đen" });
        jacket.Skus.Add(new ProductSku { SkuCode = "BM-BLK-XL", Price = 350000, StockQuantity = 45, Size = "XL", Color = "Đen" });
        jacket.Skus.Add(new ProductSku { SkuCode = "BM-GRN-L", Price = 350000, StockQuantity = 30, Size = "L", Color = "Xanh Rêu" });
        jacket.Images.Add(new ProductImage { ImageUrl = "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop", IsMain = true });

        context.Products.AddRange(phone, laptop, jacket);
        await context.SaveChangesAsync();
    }
}

app.Run();
