#!/bin/bash

echo "🕐 Thiết lập cron job cho auto-update..."

# Lấy đường dẫn hiện tại
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SCRIPT_PATH="$PROJECT_DIR/scripts/auto-update.sh"
LOG_PATH="$PROJECT_DIR/logs/auto-update.log"

# Tạo thư mục logs
mkdir -p "$PROJECT_DIR/logs"

echo "📁 Project Directory: $PROJECT_DIR"
echo "📄 Script Path: $SCRIPT_PATH"
echo "📋 Log Path: $LOG_PATH"

# Make script executable
chmod +x "$SCRIPT_PATH"

# Backup current crontab
crontab -l > /tmp/crontab_backup 2>/dev/null || touch /tmp/crontab_backup

# Remove existing entry if any
grep -v "VoucherManager_AutoUpdate" /tmp/crontab_backup > /tmp/crontab_new

# Add new cron job (every 15 minutes)
echo "*/15 * * * * cd $PROJECT_DIR && $SCRIPT_PATH >> $LOG_PATH 2>&1 # VoucherManager_AutoUpdate" >> /tmp/crontab_new

# Install new crontab
crontab /tmp/crontab_new

if [ $? -eq 0 ]; then
    echo "✅ Đã thiết lập thành công!"
    echo ""
    echo "📋 Thông tin cron job:"
    echo "   - Tần suất: Mỗi 15 phút"
    echo "   - Script: $SCRIPT_PATH"
    echo "   - Log: $LOG_PATH"
    echo ""
    echo "🔧 Quản lý cron job:"
    echo "   - Xem cron jobs: crontab -l"
    echo "   - Chỉnh sửa: crontab -e"
    echo "   - Xem log: tail -f $LOG_PATH"
    echo ""
    
    # Test run
    echo "🧪 Chạy test lần đầu..."
    cd "$PROJECT_DIR"
    "$SCRIPT_PATH"
    
    echo ""
    echo "🎉 Hoàn thành thiết lập! Auto-update sẽ chạy mỗi 15 phút."
else
    echo "❌ Lỗi khi thiết lập cron job"
    exit 1
fi

# Cleanup
rm -f /tmp/crontab_backup /tmp/crontab_new