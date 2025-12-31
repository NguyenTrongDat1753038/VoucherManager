---
description: Setup HTTPS with SSL Certificate for VoucherManager
---

# Setup HTTPS với SSL Certificate

## Prerequisites
- [x] Docker và Docker Compose đang chạy
- [ ] Port 80 đã được forward trên router
- [ ] Port 443 đã được forward trên router
- [ ] DuckDNS đang trỏ đúng IP public

## Steps

### 1. Kiểm tra Port Forwarding trên Router

Đăng nhập vào router admin panel và thêm/kiểm tra rules:

**Port 80 (HTTP):**
- External Port: `80`
- Internal IP: `<IP mini PC>` (ví dụ: 192.168.1.100)
- Internal Port: `80`
- Protocol: `TCP`

**Port 443 (HTTPS):**
- External Port: `443`
- Internal IP: `<IP mini PC>` (ví dụ: 192.168.1.100)
- Internal Port: `443`
- Protocol: `TCP`

### 2. Kiểm tra DuckDNS

Verify domain đang trỏ đúng IP:

```bash
nslookup primebuvouchermanager.duckdns.org
```

IP trả về phải khớp với IP public của bạn.

### 3. Cập nhật Email trong SSL Script

Mở file `scripts/setup-ssl.sh` và thay đổi:
```bash
EMAIL="your-email@example.com"  # Đổi thành email thật của bạn
```

### 4. Đảm bảo Docker Services đang chạy

```bash
docker-compose ps
```

Nếu chưa chạy:
```bash
docker-compose up -d
```

### 5. Chạy Script Setup SSL

**Trên Windows (dùng Git Bash hoặc WSL):**
```bash
bash scripts/setup-ssl.sh
```

**Hoặc chạy trực tiếp với Docker:**
```bash
docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot --email "your-email@example.com" --agree-tos --no-eff-email -d primebuvouchermanager.duckdns.org
```

### 6. Enable HTTPS trong Nginx Config

Uncomment HTTPS server block trong `nginx/nginx.conf` (dòng 110-184).

### 7. Restart Nginx

```bash
docker-compose restart nginx
```

### 8. Verify HTTPS

Truy cập: `https://primebuvouchermanager.duckdns.org`

Kiểm tra certificate:
```bash
openssl s_client -connect primebuvouchermanager.duckdns.org:443 -servername primebuvouchermanager.duckdns.org
```

## Troubleshooting

### Lỗi: "Failed to obtain SSL certificate"

**Nguyên nhân thường gặp:**
1. Port 80 chưa được forward đúng
2. DuckDNS chưa cập nhật IP
3. Nginx chưa chạy hoặc không serve `.well-known/acme-challenge/`

**Giải pháp:**
- Kiểm tra port forwarding
- Đợi DuckDNS propagate (5-10 phút)
- Restart Docker services

### Lỗi: "Connection refused" khi truy cập HTTPS

**Nguyên nhân:**
- Port 443 chưa được forward
- Nginx chưa enable HTTPS block

**Giải pháp:**
- Kiểm tra port forwarding cho port 443
- Verify HTTPS block đã được uncomment trong nginx.conf

## Auto-Renewal

Certbot container đã được config để tự động renew certificate mỗi 12 giờ (xem `docker-compose.yml`).

Không cần làm gì thêm!
