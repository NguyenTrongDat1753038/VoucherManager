#!/bin/bash
# Setup Cron Job for DuckDNS Auto-Update
# This ensures your domain always points to your home IP

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DUCKDNS_SCRIPT="${SCRIPT_DIR}/duckdns-update.sh"

echo "⏰ Setting up DuckDNS auto-update cron job..."

# Make script executable
chmod +x "$DUCKDNS_SCRIPT"

# Create log directory
sudo mkdir -p /var/log
sudo touch /var/log/duckdns.log
sudo chmod 666 /var/log/duckdns.log

# Add to crontab (runs every 5 minutes)
CRON_JOB="*/5 * * * * $DUCKDNS_SCRIPT"

# Check if cron job already exists
(crontab -l 2>/dev/null | grep -F "$DUCKDNS_SCRIPT") && {
    echo "✅ Cron job already exists"
    exit 0
}

# Add cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job added successfully!"
echo "📝 DuckDNS will update every 5 minutes"
echo "📊 Check logs at: /var/log/duckdns.log"
echo ""
echo "Test the script manually:"
echo "  bash $DUCKDNS_SCRIPT"
