# 🚀 Quick Start - Deploy to Mini PC

## TL;DR - Fast Track (10 minutes)

```bash
# 1. Copy .env.production
cp .env.production.example .env.production
nano .env.production  # Fill in Supabase credentials

# 2. Make scripts executable
chmod +x scripts/*.sh

# 3. Deploy
./scripts/deploy.sh

# 4. Setup SSL (after port forwarding)
./scripts/setup-ssl.sh

# 5. Setup DuckDNS auto-update
./scripts/setup-cron.sh

# Done! ✅
```

---

## 📍 You are here

✅ Domain created: `primebuvouchermanager.duckdns.org`  
✅ Token: `e41cac8b-8fc1-48c8-a1ed-8a815b074e3f`  
✅ Docker files created  
⬜ Port forwarding  
⬜ Deploy  
⬜ SSL setup  

---

## 🎯 Next Steps

### 1. **Router Port Forwarding** (5 mins)
   - Login to router (usually `192.168.1.1`)
   - Forward port **80** → Mini PC IP
   - Forward port **443** → Mini PC IP

### 2. **Copy project to Mini PC**
   ```bash
   # On your computer
   git push  # Push to GitHub/GitLab first
   
   # On Mini PC
   git clone <your-repo> VoucherManager
   cd VoucherManager
   ```

### 3. **Configure Environment**
   ```bash
   cp .env.production.example .env.production
   nano .env.production
   ```
   
   Fill in your Supabase credentials from `.env.local`

### 4. **Deploy!**
   ```bash
   chmod +x scripts/*.sh
   ./scripts/deploy.sh
   ```

### 5. **Setup SSL**
   ```bash
   # Edit email first
   nano scripts/setup-ssl.sh
   
   # Run SSL setup
   ./scripts/setup-ssl.sh
   ```

### 6. **Setup DuckDNS Auto-Update**
   ```bash
   ./scripts/setup-cron.sh
   ```

---

## 📊 Monitoring

```bash
# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Check health
curl https://primebuvouchermanager.duckdns.org/api/health
```

---

## 🆘 Help!

**Cannot access domain?**
1. Check port forwarding in router
2. Check DuckDNS IP: `cat /var/log/duckdns.log`
3. Check Docker: `docker-compose ps`

**SSL failed?**
1. Make sure port 80 is open
2. Check logs: `docker-compose logs certbot`
3. Wait 2-3 minutes and retry

**App not starting?**
```bash
docker-compose logs voucher-app
# Share error with me
```

---

## 📖 Full Documentation

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete guide.

---

**Happy Deploying! 🎉**
