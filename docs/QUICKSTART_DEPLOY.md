# 🚀 Quick Start - Deploy to Mini PC

## TL;DR - Fast Track (5 minutes)

```bash
# 1. Copy .env.production
cp .env.production.example .env.production
nano .env.production  # Fill in Supabase credentials

# 2. Update TUNNEL_TOKEN in docker-compose.yml
nano docker-compose.yml  # Paste your Cloudflare Tunnel token

# 3. Deploy
docker-compose up -d --build

# Done! ✅
```

---

## 📍 Workflow hiện tại

✅ Cloudflare Tunnel đã được cấu hình  
✅ Domain: `vouchermanager.primeebu.com`  
✅ Docker files đã sẵn sàng  
✅ SSL tự động từ Cloudflare  

---

## 🎯 Steps

### 1. **Cấu hình Cloudflare Tunnel** (nếu chưa có)
   - Đăng nhập [Cloudflare Zero Trust](https://dash.cloudflare.com/)
   - Tạo tunnel và copy token
   - Cấu hình Public Hostname → `http://voucher-app:3000`

### 2. **Copy project to Mini PC**
   ```bash
   # On your computer
   git push  # Push to GitHub first
   
   # On Mini PC
   git clone <your-repo> VoucherManager
   cd VoucherManager
   ```

### 3. **Configure Environment**
   ```bash
   cp .env.production.example .env.production
   nano .env.production
   ```
   
   Fill in your Supabase credentials

### 4. **Update Tunnel Token**
   
   Sửa `docker-compose.yml`:
   ```yaml
   tunnel:
     environment:
       - TUNNEL_TOKEN=<your-token>
   ```

### 5. **Deploy!**
   ```bash
   docker-compose up -d --build
   ```

---

## 📊 Monitoring

```bash
# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Check health
curl https://vouchermanager.primeebu.com/api/health
```

---

## 🆘 Help!

**Cannot access domain?**
1. Check tunnel logs: `docker-compose logs tunnel`
2. Verify Public Hostname trong Cloudflare Dashboard
3. Check Docker: `docker-compose ps`

**App not starting?**
```bash
docker-compose logs voucher-app
# Share error with me
```

**Tunnel không kết nối?**
1. Kiểm tra token đúng chưa
2. Restart: `docker-compose restart tunnel`
3. Tạo token mới từ Cloudflare

---

## 📖 Full Documentation

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete guide.

---

**Happy Deploying! 🎉**
