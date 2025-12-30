@echo off
echo 🕐 Thiết lập Windows Task Scheduler cho auto-update...

REM Lấy đường dẫn hiện tại
set CURRENT_DIR=%~dp0
set PROJECT_DIR=%CURRENT_DIR:~0,-9%
set SCRIPT_PATH=%PROJECT_DIR%scripts\auto-update.bat
set LOG_PATH=%PROJECT_DIR%logs\auto-update.log

REM Tạo thư mục logs nếu chưa có
if not exist "%PROJECT_DIR%logs" mkdir "%PROJECT_DIR%logs"

echo 📁 Project Directory: %PROJECT_DIR%
echo 📄 Script Path: %SCRIPT_PATH%
echo 📋 Log Path: %LOG_PATH%

REM Xóa task cũ nếu có
schtasks /delete /tn "VoucherManager_AutoUpdate" /f >nul 2>&1

REM Tạo task mới
schtasks /create ^
    /tn "VoucherManager_AutoUpdate" ^
    /tr "cmd /c \"\"%SCRIPT_PATH%\" >> \"%LOG_PATH%\" 2>&1\"" ^
    /sc minute ^
    /mo 15 ^
    /ru "SYSTEM" ^
    /rl highest ^
    /f

if errorlevel 1 (
    echo ❌ Lỗi khi tạo scheduled task
    echo 💡 Hãy chạy script này với quyền Administrator
    pause
    exit /b 1
)

echo ✅ Đã thiết lập thành công!
echo.
echo 📋 Thông tin task:
echo    - Tên: VoucherManager_AutoUpdate
echo    - Tần suất: Mỗi 15 phút
echo    - Script: %SCRIPT_PATH%
echo    - Log: %LOG_PATH%
echo.
echo 🔧 Quản lý task:
echo    - Xem task: schtasks /query /tn "VoucherManager_AutoUpdate"
echo    - Chạy ngay: schtasks /run /tn "VoucherManager_AutoUpdate"
echo    - Xóa task: schtasks /delete /tn "VoucherManager_AutoUpdate" /f
echo    - Xem log: type "%LOG_PATH%"
echo.

REM Chạy test ngay
echo 🧪 Chạy test lần đầu...
call "%SCRIPT_PATH%"

echo.
echo 🎉 Hoàn thành thiết lập! Auto-update sẽ chạy mỗi 15 phút.
pause