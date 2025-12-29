# 🚀 Deployment Guide - Voucher Manager Homelab

Hướng dẫn đầy đủ để deploy Voucher Manager lên Mini PC homelab server với DuckDNS + Docker + SSL.

---

## 📋 Prerequisites

**Trên Mini PC Server:**
- ✅ Ubuntu/Debian Linux (hoặc Windows với WSL2)
- ✅ Docker & Docker Compose đã cài
- ✅ Git đã cài
- ✅ Port 80, 443 accessible từ internet

**Đã hoàn thành:**
- ✅ DuckDNS domain: `primebuvouchermanager.duckdns.org`
- ✅ DuckDNS Token: `e41cac8b-8fc1-48c8-a1ed-8a815b074e3f`
- ✅ Supabase project đã setup (chạy `setup.sql` và `improvements.sql`)

---

## 🔧 Step-by-Step Deployment

### **Bước 1: Setup Router Port Forwarding**

Vào router của bạn (thường là `192.168.1.1`) và forward:
- **Port 80** → IP của Mini PC → Port 80 (HTTP)
- **Port 443** → IP của Mini PC → Port 443 (HTTPS)

**Kiểm tra:**
```bash
curl https://www.duckdns.org/update?domains=primebuvouchermanager&token=e41cac8b-8fc1-48c8-a1ed-8a815b074e3f
# Phải trả về: OK
```

---

### **Bước 2: Clone Project lên Mini PC**

```bash
# Clone repo (hoặc copy folder qua)
cd ~
git clone <your-repo-url> VoucherManager
cd VoucherManager

# Hoặc nếu đã có folder:
cd /path/to/VoucherManager
```

---

### **Bước 3: Cấu hình Environment Variables**

```bash
# Copy template
cp .env.production.example .env.production

# Sửa file .env.production
nano .env.production
```

Điền thông tin Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=https://primebuvouchermanager.duckdns.org
NODE_ENV=production
```

---

### **Bước 4: Sửa Next.js Config để support Docker**

Thêm vào `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  output: 'standalone',  // Thêm dòng này!
  // ... các config khác
};
```

---

### **Bước 5: Build và Deploy**

```bash
# Cho quyền executable cho scripts
chmod +x scripts/*.sh

# Deploy app
./scripts/deploy.sh
```

Chờ khoảng 2-3 phút để build xong.

---

### **Bước 6: Setup SSL Certificate**

```bash
# Sửa email trong script (dòng 7)
nano scripts/setup-ssl.sh  
# Thay your-email@example.com bằng email thật của bạn

# Chạy setup SSL
./scripts/setup-ssl.sh
```

**Lưu ý:** Trước khi chạy lệnh này:
- ✅ Port 80 phải được forward
- ✅ Domain phải trỏ đến IP của bạn
- ✅ Docker containers phải đang chạy

---

### **Bước 7: Setup Auto-Update DuckDNS IP**

Vì IP nhà bạn có thể thay đổi, cần auto-update:

```bash
# Setup cron job
./scripts/setup-cron.sh

# Test thử
bash scripts/duckdns-update.sh
```

Cron sẽ update IP mỗi 5 phút.

---

## ✅ Verification

### **Check Docker Status:**
```bash
docker-compose ps
```

Tất cả services phải **Up** và **healthy**.

### **Check Logs:**
```bash
# Xem logs
docker-compose logs -f

# Hoặc chỉ logs của app
docker-compose logs -f voucher-app
```

### **Test Local:**
```bash
# Test HTTP
curl http://localhost

# Test HTTPS
curl https://primebuvouchermanager.duckdns.org
```

### **Test từ bên ngoài:**
Mở browser trên điện thoại (tắt WiFi, dùng 4G):
```
https://primebuvouchermanager.duckdns.org
```

---

## 🔄 Update & Maintenance

### **Update Code:**
```bash
git pull
./scripts/deploy.sh
```

### **View Logs:**
```bash
docker-compose logs -f
```

### **Restart Services:**
```bash
docker-compose restart
```

### **Stop Services:**
```bash
docker-compose down
```

### **Renew SSL (tự động, nhưng có thể force):**
```bash
docker-compose run --rm certbot renew
docker-compose restart nginx
```

---

## 🛡️ Security Checklist

- ✅ Firewall: Chỉ mở port 80, 443
- ✅ SSL: HTTPS enabled với Let's Encrypt
- ✅ Rate limiting: Nginx có rate limit
- ✅ Supabase RLS: Row Level Security enabled
- ✅ Environment variables: Không commit `.env.production`
- ✅ Update: Thường xuyên `docker-compose pull`

---

## 🐛 Troubleshooting

### **Lỗi: Cannot connect to domain**
1. Check port forwarding trên router
2. Check DuckDNS IP: `curl https://www.duckdns.org/update?domains=primebuvouchermanager&token=e41cac8b-8fc1-48c8-a1ed-8a815b074e3f`
3. Check firewall: `sudo ufw status`

### **Lỗi: SSL certificate failed**
1. Chắc port 80 đã forward
2. Thử manual: `docker-compose logs certbot`
3. Check domain DNS: `nslookup primebuvouchermanager.duckdns.org`

### **Lỗi: App không start**
```bash
docker-compose logs voucher-app
# Check lỗi gì và google/hỏi tôi
```

### **Lỗi: Supabase connection**
1. Check `.env.production` đúng chưa
2. Test Supabase API: `curl https://your-project.supabase.co`
3. Check RLS policies đã enable chưa

---

## 📊 Monitoring

### **Real-time Logs:**
```bash
docker-compose logs -f
```

### **Resource Usage:**
```bash
docker stats
```

### **Check Health:**
```bash
curl https://primebuvouchermanager.duckdns.org/api/health
```

---

## 🎯 Next Steps

1. **Backup Strategy**: Setup daily backup cho Supabase data
2. **Monitoring**: Cài Uptime Kuma hoặc similar
3. **Auto-deploy**: Setup GitHub Actions để auto-deploy
4. **Analytics**: Add Google Analytics/Plausible

---

## 📞 Support

Nếu có vấn đề, check:
1. Docker logs: `docker-compose logs`
2. DuckDNS logs: `cat /var/log/duckdns.log`
3. Nginx logs: `docker-compose logs nginx`

**Happy deploying! 🚀**
