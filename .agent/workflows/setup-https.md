---
description: Setup HTTPS with Cloudflare Tunnel for VoucherManager
---

# Setup HTTPS với Cloudflare Tunnel

## ⚠️ Lưu ý quan trọng

Dự án này đã chuyển từ **Certbot + Nginx + DuckDNS** sang **Cloudflare Tunnel** để đơn giản hóa việc deploy và tăng bảo mật.

### Lý do chuyển đổi:
- ✅ **Không cần port forwarding** trên router (80, 443)
- ✅ **SSL tự động** - Cloudflare cấp và gia hạn certificate
- ✅ **Bảo mật cao hơn** - IP thật không bị lộ
- ✅ **Đơn giản hơn** - Chỉ cần 1 container tunnel

---

## Prerequisites

- [x] Có tài khoản Cloudflare
- [x] Domain đã được thêm vào Cloudflare
- [x] Docker và Docker Compose đang chạy

---

## Cách hoạt động

```
[User] → [vouchermanager.primeebu.com] → [Cloudflare Edge]
                                              ↓
                                        [Cloudflare Tunnel]
                                              ↓
                                    [voucher-app container :3000]
```

---

## Setup Steps

### 1. Tạo Cloudflare Tunnel (nếu chưa có)

1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Chọn **Zero Trust** → **Networks** → **Tunnels**
3. Click **Create a tunnel**
4. Đặt tên tunnel (vd: `voucher-manager`)
5. Copy **Tunnel Token** được cấp

### 2. Cấu hình Public Hostname

Trong tunnel configuration:
- **Subdomain**: `vouchermanager`  
- **Domain**: `primeebu.com`
- **Service**: `http://voucher-app:3000`

### 3. Cập nhật docker-compose.yml

Token đã được cấu hình trong `docker-compose.yml`:

```yaml
services:
  tunnel:
    image: cloudflare/cloudflared:latest
    container_name: voucher-tunnel
    restart: unless-stopped
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=<your-tunnel-token>
    networks:
      - voucher-network
```

### 4. Start Services

```bash
docker-compose up -d
```

### 5. Verify

Truy cập: `https://vouchermanager.primeebu.com`

---

## Troubleshooting

### Tunnel không kết nối được

1. **Kiểm tra logs:**
```bash
docker logs voucher-tunnel
```

2. **Kiểm tra token:**
- Token phải đúng và chưa bị revoke
- Có thể tạo token mới từ Cloudflare Dashboard

### Website không load

1. **Kiểm tra app container:**
```bash
docker logs voucher-manager
```

2. **Kiểm tra network:**
```bash
docker network inspect vouchermanager_voucher-network
```

3. **Verify Public Hostname config:**
- Service URL phải là `http://voucher-app:3000` (container name, không phải localhost)

---

## Bảo mật

### Đã có sẵn:
- ✅ HTTPS mặc định
- ✅ DDoS protection từ Cloudflare
- ✅ IP gốc ẩn sau Cloudflare

### Khuyến nghị thêm:
- Enable **Cloudflare Access** nếu muốn giới hạn ai có thể truy cập
- Enable **Bot Fight Mode** trong dashboard

---

## So sánh với phương án cũ

| Tính năng | Cloudflare Tunnel | ~~Certbot + Nginx + DuckDNS~~ |
|-----------|-------------------|-------------------------------|
| **Port forwarding** | ❌ Không cần | ✅ Cần mở 80, 443 |
| **SSL Certificate** | Tự động | Phải setup Certbot |
| **Gia hạn SSL** | Tự động | Cron job |
| **Domain** | Domain mua | DuckDNS subdomain |
| **Bảo mật** | IP ẩn | IP lộ |
| **Containers cần thiết** | 2 (app + tunnel) | 3 (app + nginx + certbot) |

---

## Files đã được cleanup

Các files sau đã được xóa vì không còn cần thiết:

- ~~`certbot/`~~ - Thư mục certbot config
- ~~`nginx/`~~ - Thư mục nginx config  
- ~~`scripts/duckdns-update.sh`~~ - DuckDNS update script
- ~~`scripts/setup-ssl.sh`~~ - SSL setup script
- ~~`scripts/setup-ssl.ps1`~~ - SSL setup PowerShell script
- ~~`scripts/setup-cron.sh`~~ - Cron setup script
