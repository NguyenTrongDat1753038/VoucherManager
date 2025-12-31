# SSL Certificate Setup Script for Windows
# Run this ONCE after deploying to get SSL certificate

$DOMAIN = "primebuvouchermanager.duckdns.org"
$EMAIL = "trongdat11ct@gmail.com"  # ⚠️ CHANGE THIS TO YOUR REAL EMAIL!

Write-Host "🔐 Setting up SSL certificate for $DOMAIN..." -ForegroundColor Cyan

# Check if Docker is running
Write-Host "`n📋 Checking Docker status..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running! Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Create required directories
Write-Host "`n📁 Creating required directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path ".\certbot\conf" | Out-Null
New-Item -ItemType Directory -Force -Path ".\certbot\www" | Out-Null
New-Item -ItemType Directory -Force -Path ".\nginx\ssl" | Out-Null

# Check if services are running
Write-Host "`n🐳 Checking Docker services..." -ForegroundColor Yellow
docker-compose ps

$continue = Read-Host "`n⚠️  Make sure nginx service is running. Continue? (y/n)"
if ($continue -ne 'y') {
    Write-Host "Aborted by user." -ForegroundColor Yellow
    exit 0
}

# Verify email
if ($EMAIL -eq "your-email@example.com") {
    Write-Host "`n❌ ERROR: Please update the EMAIL variable in this script!" -ForegroundColor Red
    Write-Host "Open scripts\setup-ssl.ps1 and change line 5 to your real email." -ForegroundColor Yellow
    exit 1
}

# Request certificate
Write-Host "`n🔐 Requesting SSL certificate from Let's Encrypt..." -ForegroundColor Cyan
Write-Host "This may take 1-2 minutes..." -ForegroundColor Gray

docker-compose run --rm certbot certonly --webroot `
    --webroot-path=/var/www/certbot `
    --email "$EMAIL" `
    --agree-tos `
    --no-eff-email `
    -d "$DOMAIN"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SSL certificate obtained successfully!" -ForegroundColor Green
    
    Write-Host "`n📝 Now you need to enable HTTPS in nginx.conf..." -ForegroundColor Yellow
    Write-Host "Would you like me to do this automatically? (y/n)" -ForegroundColor Yellow
    $enableHttps = Read-Host
    
    if ($enableHttps -eq 'y') {
        Write-Host "`n🔧 Enabling HTTPS in nginx.conf..." -ForegroundColor Cyan
        
        # Backup original file
        Copy-Item ".\nginx\nginx.conf" ".\nginx\nginx.conf.backup" -Force
        Write-Host "✅ Backup created: nginx\nginx.conf.backup" -ForegroundColor Green
        
        # Uncomment HTTPS block (lines 110-184)
        $content = Get-Content ".\nginx\nginx.conf" -Raw
        $content = $content -replace '(?m)^    # (server \{)', '    $1'
        $content = $content -replace '(?m)^    #     ', '        '
        $content = $content -replace '(?m)^    # \}', '    }'
        
        Set-Content ".\nginx\nginx.conf" $content
        Write-Host "✅ HTTPS enabled in nginx.conf" -ForegroundColor Green
    }
    
    Write-Host "`n🔄 Restarting Nginx..." -ForegroundColor Cyan
    docker-compose restart nginx
    
    Write-Host "`n🎉 Done! Your site should now be available at:" -ForegroundColor Green
    Write-Host "   https://$DOMAIN" -ForegroundColor Cyan
    
    Write-Host "`n📌 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Make sure port 443 is forwarded on your router" -ForegroundColor White
    Write-Host "   2. Test HTTPS access: https://$DOMAIN" -ForegroundColor White
    Write-Host "   3. Check certificate: https://www.ssllabs.com/ssltest/" -ForegroundColor White
    
}
else {
    Write-Host "`n❌ Failed to obtain SSL certificate" -ForegroundColor Red
    Write-Host "`nMake sure:" -ForegroundColor Yellow
    Write-Host "  1. Port 80 is forwarded to this server on your router" -ForegroundColor White
    Write-Host "  2. Domain $DOMAIN points to your public IP" -ForegroundColor White
    Write-Host "  3. Docker services are running (docker-compose ps)" -ForegroundColor White
    Write-Host "  4. Nginx is accessible on port 80" -ForegroundColor White
    
    Write-Host "`n🔍 Debug commands:" -ForegroundColor Cyan
    Write-Host "  Test port 80: curl http://$DOMAIN" -ForegroundColor Gray
    Write-Host "  Check DNS: nslookup $DOMAIN" -ForegroundColor Gray
    Write-Host "  View logs: docker-compose logs nginx" -ForegroundColor Gray
    
    exit 1
}
