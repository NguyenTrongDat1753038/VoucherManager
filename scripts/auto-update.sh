#!/bin/bash

LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

echo "$LOG_PREFIX 🔍 Kiểm tra cập nhật từ GitHub..."

# Lấy commit hash hiện tại
CURRENT_COMMIT=$(git rev-parse HEAD)

# Fetch latest từ remote
if ! git fetch origin main 2>/dev/null; then
    echo "$LOG_PREFIX ❌ Lỗi khi fetch từ GitHub"
    exit 1
fi

# Lấy commit hash mới nhất từ remote
LATEST_COMMIT=$(git rev-parse origin/main)

# So sánh commit hash
if [ "$CURRENT_COMMIT" = "$LATEST_COMMIT" ]; then
    echo "$LOG_PREFIX ✅ Đã là phiên bản mới nhất"
    exit 0
fi

echo "$LOG_PREFIX 🆕 Phát hiện cập nhật mới!"
echo "$LOG_PREFIX Current: ${CURRENT_COMMIT:0:7}"
echo "$LOG_PREFIX Latest:  ${LATEST_COMMIT:0:7}"

# Backup current state
echo "$LOG_PREFIX 💾 Tạo backup..."
mkdir -p backups
BACKUP_NAME="backup_$(date '+%Y%m%d_%H%M%S')"
git stash push -m "Auto-backup before update $BACKUP_NAME"

# Pull latest changes
echo "$LOG_PREFIX ⬇️ Đang tải cập nhật..."
if ! git pull origin main; then
    echo "$LOG_PREFIX ❌ Lỗi khi pull code mới"
    echo "$LOG_PREFIX 🔄 Khôi phục từ backup..."
    git stash pop
    exit 1
fi

# Rebuild and restart containers
echo "$LOG_PREFIX 🔄 Khởi động lại ứng dụng..."
docker-compose down
docker-compose up -d --build

# Wait for services to start
echo "$LOG_PREFIX ⏳ Đợi services khởi động..."
sleep 30

# Health check
echo "$LOG_PREFIX 🏥 Kiểm tra sức khỏe ứng dụng..."
INTERNAL_IP=$(hostname -I | awk '{print $1}')
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$INTERNAL_IP:8080/api/health)

if [ "$HTTP_STATUS" = "200" ]; then
    echo "$LOG_PREFIX ✅ Cập nhật thành công! Ứng dụng đang hoạt động bình thường"
    echo "$LOG_PREFIX 🌐 Truy cập tại: http://$INTERNAL_IP:8080"
else
    echo "$LOG_PREFIX ⚠️ Cảnh báo: Ứng dụng có thể chưa sẵn sàng (HTTP: $HTTP_STATUS)"
    echo "$LOG_PREFIX 🔍 Kiểm tra logs: docker-compose logs -f voucher-app"
fi

echo "$LOG_PREFIX 🏁 Hoàn thành kiểm tra cập nhật"