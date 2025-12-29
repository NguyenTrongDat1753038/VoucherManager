# 🎫 Voucher Manager

A professional, production-ready voucher management system built with Next.js 15, Supabase, and TypeScript. Designed for homelab deployment with Docker.

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-2.47-green?logo=supabase)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

### 🎯 Core Functionality
- **Voucher Management**: Create, track, and manage vouchers with ease
- **Status Tracking**: UNUSED → SENT → SOLD workflow with audit trail
- **Customer Tracking**: Record customer information and transaction history
- **Bulk Import**: CSV import for batch voucher creation
- **Export**: Export filtered vouchers to CSV

### 🔒 Security
- **Row Level Security (RLS)**: Database-level access control
- **Optimistic Locking**: Prevent duplicate selling with version control
- **Audit Logging**: Complete history of all voucher changes
- **Rate Limiting**: Protection against abuse
- **HTTPS/SSL**: Secure encrypted connections

### 🚀 Performance
- **Server Components**: Optimized rendering with Next.js 15
- **Docker Deployment**: Production-ready containerization
- **Nginx Reverse Proxy**: Load balancing and caching
- **Health Checks**: Automatic service monitoring

### 🎨 User Experience
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Real-time Updates**: Instant feedback on actions
- **Smart Workflows**: Guided customer confirmation flow
- **Search & Filter**: Quick voucher lookup

---

## 📸 Screenshots

*Coming soon*

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Docker + Nginx + Let's Encrypt
- **DNS**: DuckDNS (for homelab)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Supabase account
- Docker & Docker Compose (for production)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/NguyenTrongDat1753038/VoucherManager.git
   cd VoucherManager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Run SQL scripts:
     1. `supabase/setup.sql` - Initial schema
     2. `supabase/improvements.sql` - Security features
   - Create your first user in Supabase Auth

4. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   ```
   http://localhost:3000
   ```

### Production Deployment (Homelab)

See **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** for complete guide.

**Quick Deploy:**
```bash
# Setup environment
cp .env.production.example .env.production
# Edit .env.production with Supabase credentials

# Deploy with Docker
chmod +x scripts/*.sh
./scripts/deploy.sh

# Setup SSL
./scripts/setup-ssl.sh

# Setup DuckDNS auto-update
./scripts/setup-cron.sh
```

---

## 📚 Documentation

- **[Quick Start](./docs/QUICKSTART.md)** - Get started in 5 minutes
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Homelab deployment
- **[Quick Deploy](./docs/QUICKSTART_DEPLOY.md)** - Fast production setup
- **[Architecture](./docs/ARCHITECTURE.md)** - System design
- **[Security Analysis](./docs/SECURITY_ANALYSIS.md)** - Security features
- **[Improvements](./docs/IMPROVEMENTS_SUMMARY.md)** - Latest enhancements
- **[Workflow](./docs/WORKFLOW.md)** - User workflows
- **[UI Guide](./docs/UI_GUIDE.md)** - Interface documentation
- **[Implementation](./docs/IMPLEMENTATION_GUIDE.md)** - Developer guide
- **[Checklist](./docs/CHECKLIST.md)** - Pre-deployment checks
- **[Project Summary](./docs/PROJECT_SUMMARY.md)** - Overview

---

## 🎯 Use Cases

- **Personal**: Manage personal vouchers and gift cards
- **Small Business**: Track gift vouchers sold to customers
- **Resellers**: Manage voucher inventory and sales
- **Homelab**: Self-hosted alternative to SaaS solutions

---

## 🔐 Security Features

- **Database**: Row Level Security (RLS) policies
- **Race Conditions**: Optimistic locking with version control
- **Audit Trail**: Complete history of all changes
- **Rate Limiting**: Request throttling (10 req/s general, 5 req/m login)
- **HTTPS**: SSL/TLS encryption with Let's Encrypt
- **CORS**: Proper origin validation
- **SQL Injection**: Parameterized queries via Supabase
- **XSS Protection**: Security headers via Nginx

---

## 📊 Status Workflow

```
UNUSED → [Copy/Send] → SENT → [Payment] → SOLD
   ↓                                         ↓
EXPIRED                                   USED
```

**Status Meanings:**
- **UNUSED**: Available for sale
- **SENT**: Sent to customer (awaiting payment) ⚠️
- **SOLD**: Payment received and confirmed ✅
- **USED**: Customer redeemed the voucher
- **EXPIRED**: Voucher expired or invalid

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.com/) - Open Source Firebase Alternative
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Lucide](https://lucide.dev/) - Beautiful icons
- [DuckDNS](https://www.duckdns.org/) - Free Dynamic DNS

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/NguyenTrongDat1753038/VoucherManager/issues)
- **Email**: Contact repository owner

---

## 🎉 Author

**Nguyen Trong Dat**
- GitHub: [@NguyenTrongDat1753038](https://github.com/NguyenTrongDat1753038)

---

**Made with ❤️ for homelab enthusiasts**
