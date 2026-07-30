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
    options.UseSqlServer(connectionString).ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

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
            FullName = "Há»‡ Thá»‘ng Admin",
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
            FullName = "Nguyá»…n VÄƒn KhÃ¡ch",
            EmailConfirmed = true
        };
        await userManager.CreateAsync(customerUser, "Member123!");
        await userManager.AddToRoleAsync(customerUser, "Member");
    }

    // Seed Categories and Products
    if (!await context.Categories.AnyAsync())
    {
        var electronics = new Category { Name = "Äiá»‡n thoáº¡i & MÃ¡y tÃ­nh", Description = "Thiáº¿t bá»‹ cÃ´ng nghá»‡ chÃ­nh hÃ£ng" };
        var fashion = new Category { Name = "Thá»i trang & Phá»¥ kiá»‡n", Description = "Thá»i trang nam ná»¯ hiá»‡n Ä‘áº¡i" };
        var home = new Category { Name = "NhÃ  cá»­a & Äá»i sá»‘ng", Description = "Äá»“ gia dá»¥ng tiá»‡n Ã­ch" };

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
                FullName = "Nguyá»…n VÄƒn NgÆ°á»i BÃ¡n",
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
                Description = "Cá»­a hÃ ng chÃ­nh hÃ£ng phÃ¢n phá»‘i thiáº¿t bá»‹ vÃ  thá»i trang cao cáº¥p.",
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
            Description = "Äiá»‡n thoáº¡i di Ä‘á»™ng iPhone 15 Pro Max cao cáº¥p nháº¥t vá»›i khung titan siÃªu nháº¹, chip A17 Pro máº¡nh máº½ vÃ  camera zoom quang há»c 5x.",
            CategoryId = electronics.Id,
            SellerId = seller.Id,
            CreatedAt = DateTime.UtcNow
        };
        phone.Skus.Add(new ProductSku { SkuCode = "IP15PM-TITAN", Price = 29990000, StockQuantity = 20, Size = "256GB", Color = "Titan Tá»± NhiÃªn" });
        phone.Skus.Add(new ProductSku { SkuCode = "IP15PM-BLUE", Price = 29490000, StockQuantity = 15, Size = "256GB", Color = "Titan Xanh" });
        phone.Images.Add(new ProductImage { ImageUrl = "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=600&auto=format&fit=crop", IsMain = true });

        var laptop = new Product
        {
            Name = "MacBook Air M3 13 inch",
            Description = "MÃ¡y tÃ­nh xÃ¡ch tay MacBook Air M3 má»ng nháº¹ Ä‘áº³ng cáº¥p, hiá»‡u nÄƒng vÆ°á»£t trá»™i tá»« Apple Silicon M3 tháº¿ há»‡ má»›i.",
            CategoryId = electronics.Id,
            SellerId = seller.Id,
            CreatedAt = DateTime.UtcNow
        };
        laptop.Skus.Add(new ProductSku { SkuCode = "MBA-M3-8G-256G", Price = 27990000, StockQuantity = 10, Size = "8GB - 256GB", Color = "XÃ¡m KhÃ´ng Gian" });
        laptop.Skus.Add(new ProductSku { SkuCode = "MBA-M3-16G-512G", Price = 32990000, StockQuantity = 8, Size = "16GB - 512GB", Color = "Báº¡c" });
        laptop.Images.Add(new ProductImage { ImageUrl = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600&auto=format&fit=crop", IsMain = true });

        // Add Fashion Products
        var jacket = new Product
        {
            Name = "Ão KhoÃ¡c Bomber Kaki Unisex",
            Description = "Ão khoÃ¡c bomber cháº¥t liá»‡u kaki 2 lá»›p cao cáº¥p, phom dÃ¡ng rá»™ng unisex cÃ¡ tÃ­nh phÃ¹ há»£p cáº£ nam vÃ  ná»¯.",
            CategoryId = fashion.Id,
            SellerId = seller.Id,
            CreatedAt = DateTime.UtcNow
        };
        jacket.Skus.Add(new ProductSku { SkuCode = "BM-BLK-L", Price = 350000, StockQuantity = 50, Size = "L", Color = "Äen" });
        jacket.Skus.Add(new ProductSku { SkuCode = "BM-BLK-XL", Price = 350000, StockQuantity = 45, Size = "XL", Color = "Äen" });
        jacket.Skus.Add(new ProductSku { SkuCode = "BM-GRN-L", Price = 350000, StockQuantity = 30, Size = "L", Color = "Xanh RÃªu" });
        jacket.Images.Add(new ProductImage { ImageUrl = "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop", IsMain = true });

        context.Products.AddRange(phone, laptop, jacket);
        await context.SaveChangesAsync();
    }
}

app.Run();

