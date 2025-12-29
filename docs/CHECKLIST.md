# ✅ DEPLOYMENT CHECKLIST

## 📋 Pre-Deployment

### Supabase Setup
- [ ] Created Supabase project
- [ ] Ran `supabase/setup.sql` completely
- [ ] Created `voucher-images` storage bucket (public)
- [ ] Created first user account via Supabase dashboard
- [ ] Copied Project URL and Anon Key

### Local Development
- [ ] Created `.env.local` with correct credentials
- [ ] Ran `npm install` successfully
- [ ] Tested `npm run dev` locally
- [ ] Can log in successfully
- [ ] Can add CODE voucher
- [ ] Can add IMAGE voucher (with upload)
- [ ] Can copy code and mark as SENT
- [ ] Can download image and mark as SENT
- [ ] Can mark SENT voucher as SOLD
- [ ] SOLD vouchers are read-only
- [ ] Can mark UNUSED as EXPIRED
- [ ] Search/filter works
- [ ] Export CSV works
- [ ] Stats dashboard shows correct numbers
- [ ] Mobile responsive (test on phone or DevTools)

---

## 🚀 Vercel Deployment

### GitHub Setup
- [ ] Initialized Git repository
- [ ] Added `.gitignore` (already included)
- [ ] Made initial commit
- [ ] Pushed to GitHub

### Vercel Configuration
- [ ] Connected GitHub repository to Vercel
- [ ] Set Framework Preset: **Next.js**
- [ ] Added environment variables:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Deployed successfully
- [ ] Verified deployment URL works

### Post-Deployment
- [ ] Updated Supabase **Site URL** with Vercel URL
- [ ] Updated Supabase **Redirect URLs** with Vercel URL
- [ ] Tested login on production
- [ ] Tested all features on production
- [ ] Confirmed images upload/display correctly

---

## 🔐 Security Verification

### Database
- [ ] RLS is enabled on `vouchers` table
- [ ] SELECT policy: Users see only own vouchers
- [ ] INSERT policy: Users can only insert own vouchers
- [ ] UPDATE policy: Only UNUSED/SENT can be updated
- [ ] DELETE policy: None (delete disabled)
- [ ] Tested: Cannot see other users' vouchers
- [ ] Tested: Cannot edit SOLD vouchers
- [ ] Tested: Cannot delete any vouchers

### Storage
- [ ] Upload policy: Only to own folder (`user_id/`)
- [ ] View policy: Public can view
- [ ] Update/Delete policy: Only own files
- [ ] Tested: Images upload to correct folder
- [ ] Tested: Public URLs work

### Authentication
- [ ] Email confirmation enabled (or auto-confirm for manual creation)
- [ ] Password strength requirements met
- [ ] Protected routes redirect to login
- [ ] Logged-in users redirect to vouchers
- [ ] Logout works correctly

---

## 📊 Feature Testing

### Core Features
- [ ] **Login/Logout**
  - [ ] Login with valid credentials
  - [ ] Error message for invalid credentials
  - [ ] Logout redirects to login
  - [ ] Cannot access /vouchers when logged out

- [ ] **Add Voucher**
  - [ ] Can add CODE type voucher
  - [ ] Can add IMAGE type voucher
  - [ ] Form validation works
  - [ ] Image upload limit (5MB) enforced
  - [ ] New voucher appears in UNUSED tab

- [ ] **View Vouchers**
  - [ ] UNUSED tab shows correct vouchers
  - [ ] SENT tab shows correct vouchers
  - [ ] SOLD tab shows correct vouchers
  - [ ] Status badges are color-coded
  - [ ] Voucher cards display all info correctly

- [ ] **Actions**
  - [ ] Copy code button works
  - [ ] "Copied!" feedback shows
  - [ ] Download image opens in new tab
  - [ ] Confirm dialog appears after copy/download
  - [ ] Customer name required when marking as SENT
  - [ ] SENT vouchers show warning
  - [ ] Mark as SOLD works from SENT tab
  - [ ] Mark as EXPIRED works from UNUSED tab
  - [ ] SOLD vouchers show "locked" message
  - [ ] Cannot copy/download from SOLD vouchers

### Additional Features
- [ ] **Search**
  - [ ] Search by brand works
  - [ ] Search by customer name works
  - [ ] Search by code works
  - [ ] Search by value works
  - [ ] Empty results show "No vouchers" message

- [ ] **Export**
  - [ ] Export CSV button works
  - [ ] CSV contains all filtered vouchers
  - [ ] CSV columns are correct
  - [ ] Filename includes tab and timestamp

- [ ] **Stats Dashboard**
  - [ ] Toggle button shows/hides stats
  - [ ] Total vouchers count is correct
  - [ ] Sold value is correct
  - [ ] Unused value is correct
  - [ ] Sent value is correct
  - [ ] Status breakdown is correct

### UI/UX
- [ ] Mobile responsive (test on 375px width)
- [ ] Tablet layout works (768px width)
- [ ] Desktop layout works (1024px+ width)
- [ ] Touch targets are large enough on mobile
- [ ] All icons display correctly
- [ ] Gradients and colors look good
- [ ] Loading states show during async operations
- [ ] Error messages are clear and helpful
- [ ] Success feedback is visible

---

## 🐛 Bug Testing

### Edge Cases
- [ ] Can handle many vouchers (try adding 50+)
- [ ] Long brand names don't break layout
- [ ] Long codes don't break layout
- [ ] Large images (up to 5MB) upload successfully
- [ ] Image type validation (only images allowed)
- [ ] Empty search returns all vouchers
- [ ] Network errors show user-friendly messages

### Status Transitions
- [ ] UNUSED → SENT works
- [ ] SENT → SOLD works
- [ ] UNUSED → EXPIRED works
- [ ] Cannot change status of SOLD vouchers
- [ ] Cannot change status of USED vouchers
- [ ] Status changes reflect immediately in UI

### Multi-User (if applicable)
- [ ] User A cannot see User B's vouchers
- [ ] User A cannot edit User B's vouchers
- [ ] Each user has separate storage folder

---

## 📱 Cross-Browser Testing

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS/iOS)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

---

## 🎯 Performance

- [ ] Initial page load < 3 seconds
- [ ] Voucher list renders quickly (< 1 second for 100 items)
- [ ] Image upload provides progress feedback
- [ ] Search filters instantly (< 100ms)
- [ ] No console errors in production
- [ ] No console warnings in production

---

## 📝 Documentation

- [ ] README.md is complete and accurate
- [ ] QUICKSTART.md is clear
- [ ] WORKFLOW.md diagrams are understandable
- [ ] SQL setup script has comments
- [ ] Code has JSDoc comments where needed

---

## 🎉 FINAL CHECK

### Before Going Live
- [ ] All tests passed
- [ ] No critical bugs
- [ ] Performance is acceptable
- [ ] Security verified
- [ ] Documentation complete

### Handoff
- [ ] Explained how to add vouchers
- [ ] Explained send/sell workflow
- [ ] Explained status meanings
- [ ] Provided admin contact for issues
- [ ] User knows how to export data

---

## 🆘 Emergency Contacts

**If something breaks:**

1. Check Supabase logs
2. Check Vercel logs
3. Check browser console (F12)
4. Review this checklist

**Critical Issues:**

- **Cannot login:** Check Supabase Auth users
- **Images not uploading:** Check Storage bucket exists and is public
- **Vouchers not showing:** Check RLS policies
- **Deploy failed:** Check environment variables in Vercel

---

✅ **Ready for Production!**

Mark all checkboxes before considering deployment complete.
