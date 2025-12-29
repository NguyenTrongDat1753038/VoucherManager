# 🚀 QUICK START - 5 Minutes Setup

## Step 1: Create Supabase Project (2 mins)

1. Go to: https://app.supabase.com
2. Click **"New Project"**
3. Fill in:
   - Name: `voucher-manager`
   - Database Password: (SAVE THIS!)
   - Region: Southeast Asia (Singapore) is closest to Vietnam
4. Click "Create new project"
5. **Wait 2 minutes** for project creation

---

## Step 2: Setup Database (1 min)

1. In Supabase, click **"SQL Editor"** (left sidebar)
2. Click **"New Query"**
3. Open file `supabase/setup.sql` from this project
4. **Copy ALL content** and paste into Supabase SQL Editor
5. Click **"Run"** (or press F5)
6. Wait for "Success" message

---

## Step 3: Create Your Account (30 seconds)

1. In Supabase, click **"Authentication"** → **"Users"**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - Email: `your@email.com`
   - Password: `your-secure-password`
   - ✅ Check "Auto Confirm User"
4. Click **"Create user"**

---

## Step 4: Get API Keys (30 seconds)

1. In Supabase, go to **"Settings"** → **"API"**
2. Copy these TWO values:
   - ✅ **Project URL** (Example: `https://abc123.supabase.co`)
   - ✅ **anon public** key (Long string starting with `eyJ...`)

---

## Step 5: Configure Project (1 min)

1. In this project folder, create file `.env.local`:

```bash
# Copy from .env.local.example
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-key-here
```

2. **Replace** with your actual values from Step 4

---

## Step 6: Install & Run (1 min)

```bash
npm install
npm run dev
```

---

## Step 7: Test It! 🎉

1. Open: http://localhost:3000
2. Login with email/password from Step 3
3. Click **"Thêm voucher"**
4. Fill in test voucher:
   - Brand: `Traveloka`
   - Value: `100000`
   - Type: `Mã CODE`
   - Code: `TEST123456`
5. Click **"Thêm voucher"**
6. See your voucher appear!

---

## ✅ You're Done!

Your voucher manager is ready to use!

### Next Steps:

- Add real vouchers
- Test copy/send flow
- Deploy to Vercel (see README.md)

---

## ⚠️ Common Issues

**Cannot login?**
→ Make sure you checked "Auto Confirm User" in Step 3

**"Failed to fetch"?**
→ Double-check `.env.local` has correct URL and key

**No vouchers showing?**
→ Make sure you ran the FULL `setup.sql` script

---

**Need help?** Check the full README.md for detailed documentation!
