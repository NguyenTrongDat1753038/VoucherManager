# 🚀 Deployment Guide - Voucher Manager Homelab

Hướng dẫn đầy đủ để deploy Voucher Manager lên Mini PC homelab server với **Cloudflare Tunnel**.

---

## 📋 Prerequisites

**Trên Mini PC Server:**
- ✅ Windows/Ubuntu/Debian Linux (hoặc Windows với WSL2)
- ✅ Docker & Docker Compose đã cài
- ✅ Git đã cài

**Đã chuẩn bị:**
- ✅ Cloudflare account
- ✅ Domain đã thêm vào Cloudflare (vd: `primeebu.com`)
- ✅ Supabase project đã setup (chạy `setup.sql` và `improvements.sql`)

---

## 🎯 Lý do chọn Cloudflare Tunnel

| Tính năng | Cloudflare Tunnel | ~~Certbot + Nginx + DuckDNS~~ |
|-----------|-------------------|-------------------------------|
| **Port forwarding** | ❌ Không cần | ✅ Cần mở 80, 443 |
| **SSL Certificate** | ✅ Tự động | Phải setup Certbot |
| **Gia hạn SSL** | ✅ Tự động | Cron job |
| **IP ẩn** | ✅ Không lộ | ❌ Bị lộ |
| **DDoS Protection** | ✅ Có sẵn | ❌ Không |

---

## 🔧 Step-by-Step Deployment

### **Bước 1: Tạo Cloudflare Tunnel**

1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Chọn **Zero Trust** → **Networks** → **Tunnels**
3. Click **Create a tunnel**
4. Đặt tên tunnel (vd: `voucher-manager`)
5. Copy **Tunnel Token** được cấp

### **Bước 2: Cấu hình Public Hostname**

Trong tunnel configuration:
- **Subdomain**: `vouchermanager`  
- **Domain**: `primeebu.com`
- **Service**: `http://voucher-app:3000`

---

### **Bước 3: Clone Project lên Mini PC**

```bash
# Clone repo (hoặc copy folder qua)
cd ~
git clone <your-repo-url> VoucherManager
cd VoucherManager

# Hoặc nếu đã có folder:
cd /path/to/VoucherManager
```

---

### **Bước 4: Cấu hình Environment Variables**

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
NEXT_PUBLIC_SITE_URL=https://vouchermanager.primeebu.com
NODE_ENV=production
```

---

### **Bước 5: Cập nhật Tunnel Token**

Sửa `docker-compose.yml` với token của bạn:

```yaml
tunnel:
  image: cloudflare/cloudflared:latest
  container_name: voucher-tunnel
  restart: unless-stopped
  command: tunnel run
  environment:
    - TUNNEL_TOKEN=<your-tunnel-token>
```

---

### **Bước 6: Build và Deploy**

```bash
# Cho quyền executable cho scripts (Linux/Mac)
chmod +x scripts/*.sh

# Deploy app
docker-compose up -d --build
```

Chờ khoảng 2-3 phút để build xong.

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

# Xem logs tunnel
docker-compose logs -f tunnel
```

### **Test Access:**

Mở browser:
```
https://vouchermanager.primeebu.com
```

---

## 🔄 Update & Maintenance

### **Update Code:**
```bash
git pull
docker-compose up -d --build
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

---

## 🛡️ Security Checklist

- ✅ HTTPS: Tự động từ Cloudflare
- ✅ DDoS Protection: Cloudflare WAF
- ✅ IP ẩn: Qua Cloudflare proxy
- ✅ Supabase RLS: Row Level Security enabled
- ✅ Environment variables: Không commit `.env.production`
- ✅ Update: Thường xuyên `docker-compose pull`

---

## 🐛 Troubleshooting

### **Lỗi: Cannot connect to domain**
1. Check tunnel logs: `docker-compose logs tunnel`
2. Verify tunnel token đúng
3. Check Public Hostname trong Cloudflare Dashboard

### **Lỗi: App không start**
```bash
docker-compose logs voucher-app
# Check lỗi gì và google/hỏi tôi
```

### **Lỗi: Supabase connection**
1. Check `.env.production` đúng chưa
2. Test Supabase API: `curl https://your-project.supabase.co`
3. Check RLS policies đã enable chưa

### **Tunnel không kết nối được**
1. Kiểm tra Internet connection
2. Tạo token mới từ Cloudflare Dashboard
3. Restart tunnel: `docker-compose restart tunnel`

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
curl https://vouchermanager.primeebu.com/api/health
```

---

## 🎯 Next Steps

1. **Backup Strategy**: Setup daily backup cho Supabase data
2. **Monitoring**: Cài Uptime Kuma hoặc similar
3. **Auto-deploy**: Setup GitHub Actions để auto-deploy
4. **Cloudflare Access**: Giới hạn ai có thể truy cập (optional)

---

## 📞 Support

Nếu có vấn đề, check:
1. Docker logs: `docker-compose logs`
2. Tunnel logs: `docker-compose logs tunnel`
3. App logs: `docker-compose logs voucher-app`

**Happy deploying! 🚀**
