# 📊 VOUCHER MANAGEMENT - FLOW DIAGRAM

## 🎯 STATUS LIFECYCLE

```
┌─────────────────────────────────────────────────────────────────┐
│                    VOUCHER STATUS FLOW                          │
└─────────────────────────────────────────────────────────────────┘

                          ┌─────────┐
                          │ CREATED │
                          └────┬────┘
                               │
                               ▼
                        ┌──────────┐
                    ┌──▶│  UNUSED  │◀──┐
                    │   └─────┬────┘   │
                    │         │         │
         Manual     │         │ Copy/Download
         Expire     │         │ + Confirm
                    │         ▼         │
                    │   ┌──────────┐   │
                    │   │   SENT   │───┘
                    │   │ (RISKY!) │
                    │   └─────┬────┘
                    │         │
                    │         │ Mark as Sold
                    │         │ (Payment received)
                    │         ▼
                    │   ┌──────────┐
                    │   │   SOLD   │──────► 🔒 LOCKED (Read-only)
                    │   └──────────┘
                    │
                    │   ┌──────────┐
                    └──▶│  EXPIRED │──────► ⛔ Manual mark
                        └──────────┘

Alternative flow:
   UNUSED ──────────────► USED (if seller uses it themselves)
```

---

## 🔄 USER WORKFLOW

### 1️⃣ NEW VOUCHER FLOW

```
User Action              System Action              Status Change
───────────              ─────────────              ─────────────

[Add Voucher]
    │
    ├─► Fill form         ─────► Validate input
    │   • Brand                  • Required fields
    │   • Value                  • Value > 0
    │   • Type                   • Code OR image
    │   • Code/Image
    │
    ├─► Submit            ─────► Upload image (if IMAGE type)
    │                            ├─► Store in Supabase Storage
    │                            └─► Generate public URL
    │
    └─► Success           ─────► Insert to database
                                 └─► status = UNUSED  ✅
```

---

### 2️⃣ SEND VOUCHER FLOW (CODE)

```
User Action              System Action              Status Change
───────────              ─────────────              ─────────────

[View UNUSED Voucher]
    │
    ├─► Click "Copy"      ─────► Copy code to clipboard
    │                            └─► Show "Copied!" ✅
    │
    ├─► Paste in Zalo/Messenger (OUTSIDE APP)
    │
    ├─► Confirm dialog    ─────► Show dialog:
    │   appears                  "Đã gửi cho khách?"
    │
    ├─► Enter customer    ─────► Validate:
    │   name                     • Name not empty
    │
    └─► Click "Đã gửi"    ─────► Update database:
                                 • status = SENT  🟡
                                 • customer_name = input
                                 • sent_at = now()
```

---

### 3️⃣ SEND VOUCHER FLOW (IMAGE)

```
User Action              System Action              Status Change
───────────              ─────────────              ─────────────

[View UNUSED Voucher]
    │
    ├─► Click "Xem/Tải"   ─────► Open image in new tab
    │                            └─► User downloads/screenshots
    │
    ├─► Send via Zalo/Messenger (OUTSIDE APP)
    │
    ├─► Confirm dialog    ─────► Show dialog:
    │   appears                  "Đã gửi cho khách?"
    │
    ├─► Enter customer    ─────► Validate:
    │   name                     • Name not empty
    │
    └─► Click "Đã gửi"    ─────► Update database:
                                 • status = SENT  🟡
                                 • customer_name = input
                                 • sent_at = now()
```

---

### 4️⃣ COMPLETE SALE FLOW

```
User Action              System Action              Status Change
───────────              ─────────────              ─────────────

[Customer pays via bank transfer/cash/Momo - OUTSIDE APP]
    │
    ├─► View SENT tab     ─────► Show all SENT vouchers
    │                            with ⚠️ WARNING badges
    │
    ├─► Click "Đánh dấu   ─────► Show confirmation:
    │   đã bán"                  "Xác nhận đã thanh toán?"
    │
    └─► Confirm           ─────► Update database:
                                 • status = SOLD  🔵
                                 • sold_at = now()
                                 
                                 Lock voucher 🔒
                                 (No more edits allowed)
```

---

### 5️⃣ EXPIRE VOUCHER FLOW

```
User Action              System Action              Status Change
───────────              ─────────────              ─────────────

[Voucher expires before use]
    │
    ├─► View UNUSED tab
    │
    ├─► Click "Đánh dấu   ─────► Show confirmation:
    │   hết hạn"                 "Xác nhận hết hạn?"
    │
    └─► Confirm           ─────► Update database:
                                 • status = EXPIRED  🔴
```

---

## 🔐 SECURITY RULES

### Database (Supabase RLS)

```
┌─────────────────────────────────────────────────────┐
│ ACTION    │ ALLOWED?  │ CONDITION                   │
├───────────┼───────────┼─────────────────────────────┤
│ SELECT    │ ✅ YES    │ owner_id = current_user     │
│ INSERT    │ ✅ YES    │ owner_id = current_user     │
│ UPDATE    │ ⚠️ LIMITED│ status = UNUSED or SENT     │
│ DELETE    │ ❌ NO     │ NEVER ALLOWED               │
└─────────────────────────────────────────────────────┘
```

### Storage (Supabase Storage)

```
┌─────────────────────────────────────────────────────┐
│ ACTION    │ ALLOWED?  │ CONDITION                   │
├───────────┼───────────┼─────────────────────────────┤
│ Upload    │ ✅ YES    │ folder = user_id            │
│ View      │ ✅ YES    │ Public bucket               │
│ Update    │ ✅ YES    │ folder = user_id            │
│ Delete    │ ✅ YES    │ folder = user_id            │
└─────────────────────────────────────────────────────┘
```

---

## 📱 UI COMPONENTS MAP

```
┌─────────────────────────────────────────────────────────────┐
│                       APP STRUCTURE                         │
└─────────────────────────────────────────────────────────────┘

app/
├── login/page.tsx
│   └── [LoginForm]
│       ├── Email input
│       ├── Password input
│       └── Submit button
│
└── vouchers/page.tsx
    └── [VouchersClient]
        ├── Header
        │   ├── Logo
        │   ├── Stats button
        │   ├── Export button
        │   └── Logout button
        │
        ├── [StatsOverview] (toggleable)
        │   ├── Total vouchers card
        │   ├── Sold value card
        │   ├── Unused value card
        │   └── Sent value card
        │
        ├── Controls
        │   ├── Search input
        │   └── Add voucher button
        │
        ├── Tabs
        │   ├── [UNUSED] 🟢
        │   ├── [SENT] 🟡
        │   └── [SOLD] 🔵
        │
        └── [VoucherList]
            └── [VoucherCard] (multiple)
                ├── Header
                │   ├── Brand name
                │   ├── Value
                │   └── Status badge
                │
                ├── Content
                │   ├── Type badge
                │   ├── Code (if CODE)
                │   └── Image (if IMAGE)
                │
                ├── Customer info (if SENT/SOLD)
                │   ├── Customer name
                │   └── Sent timestamp
                │
                └── Actions (varies by status)
                    ├── Copy/Download (if UNUSED/SENT)
                    ├── Mark as Sent (after copy/download)
                    ├── Mark as Sold (if SENT)
                    └── Mark as Expired (if UNUSED)

Modals:
├── [AddVoucherModal]
│   ├── Brand input
│   ├── Value input
│   ├── Type selector (CODE/IMAGE)
│   ├── Code input (if CODE)
│   ├── Image upload (if IMAGE)
│   └── Submit button
│
└── [ConfirmDialog] (reusable)
    ├── Title
    ├── Message
    ├── Custom content (e.g., customer name input)
    └── Confirm/Cancel buttons
```

---

## 📊 DATA FLOW

```
┌─────────────┐      ┌──────────────┐      ┌────────────┐
│   Browser   │◀────▶│   Next.js    │◀────▶│  Supabase  │
│  (Client)   │      │   (Server)   │      │ (Backend)  │
└─────────────┘      └──────────────┘      └────────────┘
      │                     │                     │
      │                     │                     │
  User Actions         API Routes           Database
      │                     │                     │
      ▼                     ▼                     ▼
                                                  
  1. Login          ─────► Auth.signIn()   ─────► auth.users
                                                  │
  2. Fetch          ─────► .from()         ─────► vouchers table
     Vouchers             .select()              (with RLS)
                                                  │
  3. Add            ─────► .insert()       ─────► INSERT
     Voucher              Upload image            + Storage
                                                  │
  4. Copy Code      ─────► Local only      ─────► (No DB call)
                          clipboard.write()       │
                                                  │
  5. Confirm Sent   ─────► .update()       ─────► UPDATE
                          status=SENT            (if RLS allows)
                                                  │
  6. Mark Sold      ─────► .update()       ─────► UPDATE
                          status=SOLD            (locks record)
```

---

## 🎨 STATUS BADGE COLORS

```
┌──────────┬─────────┬──────────────┬────────────────┐
│ STATUS   │ EMOJI   │ COLOR        │ MEANING        │
├──────────┼─────────┼──────────────┼────────────────┤
│ UNUSED   │ 🟢      │ Green        │ Available      │
│ SENT     │ 🟡      │ Yellow       │ Risky/Pending  │
│ SOLD     │ 🔵      │ Blue         │ Completed      │
│ USED     │ 🟣      │ Purple       │ Self-used      │
│ EXPIRED  │ 🔴      │ Red          │ Invalid        │
└──────────┴─────────┴──────────────┴────────────────┘
```

---

## ⚠️ WARNING SYSTEM

```
SENT Status Triggers:
───────────────────

┌────────────────────────────────────────┐
│  ⚠️  VOUCHER ĐÃ GỬI - RỦI RO!         │
│                                        │
│  Đã gửi cho khách nhưng chưa TT.      │
│  Cần theo dõi thanh toán!              │
└────────────────────────────────────────┘

Visual Indicators:
• Yellow border on card
• Warning icon + message
• Highlighted in SENT tab
• Tracked separately in stats
```

---

## 🔒 READ-ONLY RULES

```
Editable States:        Non-Editable States:
─────────────────       ─────────────────────

✅ UNUSED               ❌ SOLD   (🔒 Locked)
✅ SENT                 ❌ USED   (🔒 Locked)
                        ❌ EXPIRED (Voided)

Actions Available:      All Actions Disabled:
──────────────────      ─────────────────────

• Copy/Download         • "Voucher đã khóa"
• Mark as Sent          • Read-only display
• Mark as Sold          • Cannot edit
• Mark as Expired       • Cannot delete
```

---

This diagram covers the complete flow of the voucher management system! 🎉
