#!/bin/bash
# SSL Certificate Setup Script
# Run this ONCE after deploying to get SSL certificate

DOMAIN="primebuvouchermanager.duckdns.org"
EMAIL="your-email@example.com"  # Change this!

echo "🔐 Setting up SSL certificate for ${DOMAIN}..."

# Create required directories
mkdir -p ./certbot/conf
mkdir -p ./certbot/www
mkdir -p ./nginx/ssl

# Request certificate
docker-compose run --rm certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully!"
    echo "📝 Restarting Nginx..."
    docker-compose restart nginx
    echo "🎉 Done! Your site is now available at https://${DOMAIN}"
else
    echo "❌ Failed to obtain SSL certificate"
    echo "Make sure:"
    echo "  1. Port 80 is forwarded to this server"
    echo "  2. Domain ${DOMAIN} points to your public IP"
    echo "  3. Docker services are running"
    exit 1
fi
