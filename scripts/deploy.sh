#!/bin/bash
# Deployment Script for Voucher Manager
# Run this on your Mini PC server

set -e  # Exit on error

echo "🚀 Deploying Voucher Manager..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production not found!"
    echo "📝 Please create .env.production from .env.production.example"
    exit 1
fi

# Pull latest changes (if using git)
if [ -d .git ]; then
    echo "📦 Pulling latest changes..."
    git pull
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build Docker images
echo "🐳 Building Docker images..."
docker-compose build --no-cache

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start services
echo "▶️  Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check health
echo "🏥 Checking service health..."
docker-compose ps

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=20

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app should be accessible at:"
echo "   - HTTP:  http://primebuvouchermanager.duckdns.org"
echo "   - HTTPS: https://primebuvouchermanager.duckdns.org (after SSL setup)"
echo ""
echo "📝 Next steps:"
echo "   1. Make sure port 80 and 443 are forwarded in your router"
echo "   2. Run ./scripts/setup-ssl.sh to get SSL certificate"
echo "   3. Setup cron for DuckDNS updates: ./scripts/setup-cron.sh"
echo ""
echo "📊 Monitor logs with: docker-compose logs -f"
