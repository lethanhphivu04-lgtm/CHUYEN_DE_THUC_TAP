---
name: hitu-market-autopilot
description: Autopilot for HITU MARKET marketplace project. Activates when user opens this workspace or says "tiếp tục", "continue", "làm tiếp", "next task". Reads progress from howitwork/tien-do.md and picks up the next incomplete phase automatically.
---

# HITU MARKET Autopilot Skill

When this skill activates, do the following:

## 1. Read Progress File
Read `howitwork/tien-do.md` in the workspace root. This file tracks which phases and tasks are complete.

## 2. Find Next Task
Scan the checklist in `tien-do.md` for the first `- [ ]` item. That is your current task.

## 3. Execute the Task
Follow the **backend-first** pattern for each module:
1. Create/modify **Entity** files in `backend/Marketplace.Core/Entities/`
2. Update **DbContext** in `backend/Marketplace.Infrastructure/Data/ApplicationDbContext.cs`
3. Run migration: `dotnet ef migrations add <Name> --project Marketplace.Infrastructure --startup-project Marketplace.API`
4. Create/modify **Controller** in `backend/Marketplace.API/Controllers/`
5. Run `dotnet build` in `backend/` to verify
6. Add API service functions in `frontend/app/_lib/api.js`
7. Create/modify the **frontend page**
8. Verify frontend compiles

## 4. Update Progress
After completing each task:
- Mark it `[x]` in `howitwork/tien-do.md`
- Update checklist in `howitwork/dac-ta-do-an-marketplace.md` if relevant
- Move to the next `[ ]` item

## 5. Architecture Rules
- Backend: ASP.NET Core (.NET 9), EF Core, SQL Server, Clean Architecture (API/Core/Infrastructure)
- Frontend: Next.js (App Router), Tailwind CSS, Axios
- Auth: ASP.NET Identity + JWT, token in localStorage
- API base: `http://localhost:5087/api`
- Vietnamese UI language throughout
- 4 roles: Guest, Member, Seller, Admin
- Key pattern: Controllers inject `ApplicationDbContext` directly (no repository layer)
- DTOs defined inline in controller files
- Frontend uses `'use client'` for interactive pages
- API service in `frontend/app/_lib/api.js` uses axios with JWT interceptor

## 6. Phase Order (Dependency-based)

### Phase 1: Hoàn thiện Frontend cho API đã có
- Admin Category CRUD page
- Admin Product management page
- Product detail page
- Homepage with real product data

### Phase 2: Cart & Orders (Module 3+5)
- Cart/CartItem entities + controller
- Order/SubOrder/OrderItem entities + controller (tách đơn theo seller)
- Frontend: cart page, checkout page, order history

### Phase 3: Payments (Module 4)
- Payment/PaymentLog entities + controller
- COD processing, VNPay integration

### Phase 4: Seller Management (Module 6)
- Seller dashboard, CRUD products, process orders
- Admin approve/reject sellers
- Commission system

### Phase 5: Admin Advanced (Module 11)
- Real user management (lock/unlock)
- Dashboard with real stats
- Audit logs

### Phase 6: Extensions (Modules 7, 8, 9)
- Vouchers, Reviews, Wishlist, Returns

### Phase 7: Notifications & Content (Module 10, 11-content)
- In-app notifications, email
- Banners, blog posts

### Phase 8: Chatbot & Polish (Module 12)
- OpenAI chatbot widget
- Autocomplete search
- UI polish

## 7. Don't Ask, Just Do
- Don't ask the user what to do next — read `tien-do.md` and continue
- Don't create implementation plans for individual tasks — just execute
- Only stop to ask when there's a genuine ambiguity not covered by the spec
