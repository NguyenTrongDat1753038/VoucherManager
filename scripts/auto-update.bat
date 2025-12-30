@echo off
setlocal enabledelayedexpansion

echo [%date% %time%] 🔍 Kiểm tra cập nhật từ GitHub...

REM Lấy commit hash hiện tại
for /f "tokens=*" %%i in ('git rev-parse HEAD') do set CURRENT_COMMIT=%%i

REM Fetch latest từ remote
git fetch origin main 2>nul
if errorlevel 1 (
    echo [%date% %time%] ❌ Lỗi khi fetch từ GitHub
    goto :end
)

REM Lấy commit hash mới nhất từ remote
for /f "tokens=*" %%i in ('git rev-parse origin/main') do set LATEST_COMMIT=%%i

REM So sánh commit hash
if "%CURRENT_COMMIT%"=="%LATEST_COMMIT%" (
    echo [%date% %time%] ✅ Đã là phiên bản mới nhất
    goto :end
)

echo [%date% %time%] 🆕 Phát hiện cập nhật mới!
echo [%date% %time%] Current: %CURRENT_COMMIT:~0,7%
echo [%date% %time%] Latest:  %LATEST_COMMIT:~0,7%

REM Backup current state
echo [%date% %time%] 💾 Tạo backup...
if not exist "backups" mkdir backups
set BACKUP_NAME=backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_NAME=%BACKUP_NAME: =0%
git stash push -m "Auto-backup before update %BACKUP_NAME%"

REM Pull latest changes
echo [%date% %time%] ⬇️ Đang tải cập nhật...
git pull origin main
if errorlevel 1 (
    echo [%date% %time%] ❌ Lỗi khi pull code mới
    echo [%date% %time%] 🔄 Khôi phục từ backup...
    git stash pop
    goto :end
)

REM Rebuild and restart containers
echo [%date% %time%] 🔄 Khởi động lại ứng dụng...
docker-compose down
docker-compose up -d --build

REM Wait for services to start
echo [%date% %time%] ⏳ Đợi services khởi động...
timeout /t 30 /nobreak > nul

REM Health check
echo [%date% %time%] 🏥 Kiểm tra sức khỏe ứng dụng...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set INTERNAL_IP=%%a
    goto :found_ip
)
:found_ip
set INTERNAL_IP=%INTERNAL_IP: =%

curl -s -o nul -w "%%{http_code}" http://%INTERNAL_IP%:8080/api/health > temp_status.txt
set /p HTTP_STATUS=<temp_status.txt
del temp_status.txt

if "%HTTP_STATUS%"=="200" (
    echo [%date% %time%] ✅ Cập nhật thành công! Ứng dụng đang hoạt động bình thường
    echo [%date% %time%] 🌐 Truy cập tại: http://%INTERNAL_IP%:8080
) else (
    echo [%date% %time%] ⚠️ Cảnh báo: Ứng dụng có thể chưa sẵn sàng (HTTP: %HTTP_STATUS%)
    echo [%date% %time%] 🔍 Kiểm tra logs: docker-compose logs -f voucher-app
)

:end
echo [%date% %time%] 🏁 Hoàn thành kiểm tra cập nhật
echo.