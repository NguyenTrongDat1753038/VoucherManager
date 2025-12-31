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

# Build and start Docker containers
echo "🐳 Building and starting Docker containers..."
docker-compose up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check health
echo "🏥 Checking service health..."
docker-compose ps

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=20

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app should be accessible at:"
echo "   - https://vouchermanager.primeebu.com"
echo ""
echo "📝 Notes:"
echo "   - SSL is handled automatically by Cloudflare"
echo "   - No port forwarding needed (Cloudflare Tunnel)"
echo ""
echo "📊 Monitor logs with: docker-compose logs -f"
echo "🔍 Check tunnel: docker-compose logs tunnel"
