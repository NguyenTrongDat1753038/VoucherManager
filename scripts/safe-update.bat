@echo off
setlocal enabledelayedexpansion

echo [%date% %time%] 🔒 Safe Auto-Update System
echo [%date% %time%] 🎯 Chỉ update từ branch 'production' hoặc tags

REM Kiểm tra branch hiện tại
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo [%date% %time%] 📍 Current branch: %CURRENT_BRANCH%

REM Fetch tất cả branches và tags
echo [%date% %time%] 🔄 Fetching từ remote...
git fetch --all --tags 2>nul
if errorlevel 1 (
    echo [%date% %time%] ❌ Lỗi khi fetch từ GitHub
    goto :end
)

REM Kiểm tra xem có branch production không
git show-ref --verify --quiet refs/remotes/origin/production
if errorlevel 1 (
    echo [%date% %time%] ⚠️ Không tìm thấy branch 'production'
    echo [%date% %time%] 🔍 Kiểm tra tags thay thế...
    goto :check_tags
)

REM Kiểm tra cập nhật từ production branch
for /f "tokens=*" %%i in ('git rev-parse HEAD') do set CURRENT_COMMIT=%%i
for /f "tokens=*" %%i in ('git rev-parse origin/production') do set PRODUCTION_COMMIT=%%i

if "%CURRENT_COMMIT%"=="%PRODUCTION_COMMIT%" (
    echo [%date% %time%] ✅ Production branch đã là phiên bản mới nhất
    goto :check_tags
)

echo [%date% %time%] 🆕 Phát hiện cập nhật production!
goto :do_update_branch

:check_tags
REM Kiểm tra tag mới nhất
for /f "tokens=*" %%i in ('git describe --tags --abbrev=0 2^>nul') do set LATEST_TAG=%%i
if "%LATEST_TAG%"=="" (
    echo [%date% %time%] ℹ️ Không có tags, giữ nguyên phiên bản hiện tại
    goto :end
)

for /f "tokens=*" %%i in ('git describe --tags --exact-match HEAD 2^>nul') do set CURRENT_TAG=%%i
if "%CURRENT_TAG%"=="%LATEST_TAG%" (
    echo [%date% %time%] ✅ Đã ở tag mới nhất: %LATEST_TAG%
    goto :end
)

echo [%date% %time%] 🏷️ Tag mới phát hiện: %LATEST_TAG%
echo [%date% %time%] 📋 Changelog:
git log --oneline %CURRENT_TAG%..%LATEST_TAG% 2>nul

set UPDATE_TARGET=%LATEST_TAG%
goto :do_update_tag

:do_update_branch
set UPDATE_TARGET=origin/production
echo [%date% %time%] 🎯 Cập nhật từ production branch
goto :do_update

:do_update_tag
echo [%date% %time%] 🎯 Cập nhật lên tag: %UPDATE_TARGET%
goto :do_update

:do_update
REM Pre-update checks
echo [%date% %time%] 🔍 Kiểm tra trước khi cập nhật...

REM Kiểm tra Docker đang chạy
docker info >nul 2>&1
if errorlevel 1 (
    echo [%date% %time%] ❌ Docker không chạy
    goto :end
)

REM Kiểm tra disk space (cần ít nhất 1GB)
for /f "tokens=3" %%i in ('dir /-c ^| find "bytes free"') do set FREE_SPACE=%%i
if %FREE_SPACE% LSS 1073741824 (
    echo [%date% %time%] ⚠️ Cảnh báo: Dung lượng disk thấp
)

REM Backup hiện tại
echo [%date% %time%] 💾 Tạo backup...
set BACKUP_NAME=backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_NAME=%BACKUP_NAME: =0%
git stash push -m "Safe backup before update to %UPDATE_TARGET% - %BACKUP_NAME%"

REM Update code
echo [%date% %time%] ⬇️ Đang cập nhật code...
if "%UPDATE_TARGET:~0,6%"=="origin" (
    git reset --hard %UPDATE_TARGET%
) else (
    git checkout %UPDATE_TARGET%
)

if errorlevel 1 (
    echo [%date% %time%] ❌ Lỗi khi cập nhật code
    echo [%date% %time%] 🔄 Khôi phục backup...
    git stash pop
    goto :end
)

REM Kiểm tra file cấu hình quan trọng
if not exist "docker-compose.yml" (
    echo [%date% %time%] ❌ Thiếu docker-compose.yml
    goto :rollback
)

if not exist ".env.production" (
    echo [%date% %time%] ❌ Thiếu .env.production
    goto :rollback
)

REM Build và test
echo [%date% %time%] 🔨 Build và test...
docker-compose build --no-cache
if errorlevel 1 (
    echo [%date% %time%] ❌ Build thất bại
    goto :rollback
)

REM Restart services
echo [%date% %time%] 🔄 Khởi động lại services...
docker-compose down
docker-compose up -d

REM Extended health check
echo [%date% %time%] 🏥 Kiểm tra sức khỏe ứng dụng (60s)...
set /a RETRY_COUNT=0
:health_check_loop
timeout /t 10 /nobreak > nul
set /a RETRY_COUNT+=1

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
    echo [%date% %time%] ✅ Cập nhật thành công!
    echo [%date% %time%] 🌐 Ứng dụng hoạt động tại: http://%INTERNAL_IP%:8080
    goto :cleanup
)

if %RETRY_COUNT% LSS 6 (
    echo [%date% %time%] ⏳ Retry %RETRY_COUNT%/6 - HTTP: %HTTP_STATUS%
    goto :health_check_loop
)

echo [%date% %time%] ❌ Health check thất bại sau 60s
goto :rollback

:rollback
echo [%date% %time%] 🔄 Rollback về phiên bản trước...
git stash pop
docker-compose down
docker-compose up -d
echo [%date% %time%] ✅ Đã rollback thành công
goto :end

:cleanup
REM Cleanup old backups (giữ 5 backups gần nhất)
git reflog expire --expire-unreachable=now --all
git gc --prune=now
echo [%date% %time%] 🧹 Đã dọn dẹp

:end
echo [%date% %time%] 🏁 Hoàn thành safe update process
echo.