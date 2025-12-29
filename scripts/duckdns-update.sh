#!/bin/bash
# DuckDNS IP Update Script
# Updates your DuckDNS domain with current public IP

DOMAIN="primebuvouchermanager"
TOKEN="e41cac8b-8fc1-48c8-a1ed-8a815b074e3f"
LOG_FILE="/var/log/duckdns.log"

# Get current public IP
CURRENT_IP=$(curl -s https://api.ipify.org)

# Update DuckDNS
RESPONSE=$(curl -s "https://www.duckdns.org/update?domains=${DOMAIN}&token=${TOKEN}&ip=${CURRENT_IP}")

# Log result
echo "$(date '+%Y-%m-%d %H:%M:%S') - IP: ${CURRENT_IP} - Response: ${RESPONSE}" >> "$LOG_FILE"

if [ "$RESPONSE" = "OK" ]; then
    echo "✅ DuckDNS updated successfully: ${CURRENT_IP}"
    exit 0
else
    echo "❌ DuckDNS update failed: ${RESPONSE}"
    exit 1
fi
