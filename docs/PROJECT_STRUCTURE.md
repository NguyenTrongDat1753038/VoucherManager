# 📁 Project Structure

```
VoucherManager/
├── 📂 app/                          # Next.js App Router
│   ├── 📂 api/
│   │   └── 📂 health/               # Health check endpoint
│   ├── 📂 login/                    # Login page
│   ├── 📂 vouchers/                 # Vouchers management
│   │   ├── VouchersClient.tsx       # Main vouchers UI
│   │   ├── actions.ts               # Server actions (import)
│   │   └── page.tsx                 # Server component
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Homepage (redirect)
│
├── 📂 components/                   # React components
│   ├── AddVoucherModal.tsx          # Add voucher dialog
│   ├── ConfirmDialog.tsx            # Confirmation modal
│   ├── CustomerNameDialog.tsx       # Customer input dialog
│   ├── ImportVoucherDialog.tsx      # CSV import dialog
│   ├── StatsOverview.tsx            # Statistics dashboard
│   ├── VoucherCard.tsx              # Voucher display card
│   ├── VoucherList.tsx              # Voucher grid
│   └── index.ts                     # Barrel export
│
├── 📂 lib/                          # Utilities
│   └── 📂 supabase/
│       ├── client.ts                # Browser client
│       ├── database.types.ts        # TypeScript types
│       └── server.ts                # Server client
│
├── 📂 supabase/                     # Database scripts
│   ├── setup.sql                    # Initial schema
│   └── improvements.sql             # Security enhancements
│
├── 📂 scripts/                      # Deployment scripts
│   ├── deploy.sh                    # Main deployment
│   ├── auto-update.sh               # Auto update script
│   ├── auto-update.bat              # Auto update (Windows)
│   ├── safe-update.bat              # Safe update with rollback
│   └── manage-autoupdate.bat        # Management interface
│
├── 📂 docs/                         # Documentation
│   ├── QUICKSTART.md                # 5-min quick start
│   ├── DEPLOYMENT.md                # Full deployment guide
│   ├── QUICKSTART_DEPLOY.md         # Fast deploy guide
│   ├── ARCHITECTURE.md              # System design
│   ├── SECURITY_ANALYSIS.md         # Security docs
│   ├── IMPROVEMENTS_SUMMARY.md      # Recent updates
│   ├── WORKFLOW.md                  # User workflows
│   ├── UI_GUIDE.md                  # UI documentation
│   ├── IMPLEMENTATION_GUIDE.md      # Dev guide
│   ├── CHECKLIST.md                 # Pre-deploy checklist
│   └── PROJECT_SUMMARY.md           # Project overview
│
├── 📂 .agent/                       # AI Agent workflows
│   └── 📂 workflows/
│       └── setup-https.md           # Cloudflare Tunnel guide
│
├── 📄 Dockerfile                    # Docker build config
├── 📄 docker-compose.yml            # Docker orchestration
├── 📄 .dockerignore                 # Docker build exclusions
├── 📄 middleware.ts                 # Next.js middleware (auth)
├── 📄 next.config.ts                # Next.js configuration
├── 📄 tailwind.config.ts            # Tailwind CSS config
├── 📄 tsconfig.json                 # TypeScript config
├── 📄 package.json                  # Dependencies
├── 📄 .env.production.example       # Env template
├── 📄 .gitignore                    # Git exclusions
├── 📄 DEPLOYMENT_STRATEGY.md        # Deployment strategy
├── 📄 LICENSE                       # MIT License
└── 📄 README.md                     # Project readme
```

## 🎯 Key Directories

### `/app` - Next.js Application
Modern App Router structure with Server and Client Components.

### `/components` - UI Components
Reusable React components with TypeScript.

### `/lib` - Utilities
Supabase clients and type definitions.

### `/supabase` - Database
SQL scripts for database setup and migrations.

### `/scripts` - Automation
Deployment and maintenance scripts.

### `/docs` - Documentation
Comprehensive guides and documentation.

## 📦 Important Files

- **`Dockerfile`** - Production Docker image
- **`docker-compose.yml`** - Multi-container setup (App + Cloudflare Tunnel)
- **`middleware.ts`** - Authentication middleware
- **`next.config.ts`** - Next.js config (standalone mode)
- **`.env.production.example`** - Environment template

## 🚀 Getting Started

1. **Development**: See `docs/QUICKSTART.md`
2. **Production**: See `docs/DEPLOYMENT.md`
3. **Fast Deploy**: See `docs/QUICKSTART_DEPLOY.md`

## 🔒 Security

- **Supabase RLS** - Row Level Security policies
- **Cloudflare** - DDoS protection, SSL, IP masking
- **Next.js Middleware** - Authentication checks

## 📝 License

See `LICENSE` file (MIT)
