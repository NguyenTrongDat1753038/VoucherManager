@echo off
setlocal

:menu
cls
echo ==========================================
echo    🔄 QUẢN LÝ AUTO-UPDATE VOUCHER MANAGER
echo ==========================================
echo.
echo 1. 🚀 Thiết lập auto-update (mỗi 15 phút)
echo 2. ▶️  Chạy update ngay bây giờ
echo 3. 📋 Xem trạng thái scheduled task
echo 4. 📄 Xem log auto-update
echo 5. ⏸️  Tạm dừng auto-update
echo 6. ▶️  Kích hoạt lại auto-update
echo 7. 🗑️  Xóa auto-update
echo 8. 🔍 Kiểm tra Git status
echo 9. ❌ Thoát
echo.
set /p choice="Chọn tùy chọn (1-9): "

if "%choice%"=="1" goto setup
if "%choice%"=="2" goto run_now
if "%choice%"=="3" goto status
if "%choice%"=="4" goto view_log
if "%choice%"=="5" goto disable
if "%choice%"=="6" goto enable
if "%choice%"=="7" goto delete
if "%choice%"=="8" goto git_status
if "%choice%"=="9" goto exit
goto menu

:setup
echo 🚀 Thiết lập auto-update...
call "%~dp0setup-scheduler.bat"
pause
goto menu

:run_now
echo ▶️ Chạy safe update ngay...
call "%~dp0safe-update.bat"
pause
goto menu

:status
echo 📋 Trạng thái scheduled task:
schtasks /query /tn "VoucherManager_AutoUpdate" /fo table /v
pause
goto menu

:view_log
echo 📄 Log auto-update (10 dòng cuối):
if exist "%~dp0..\logs\auto-update.log" (
    powershell "Get-Content '%~dp0..\logs\auto-update.log' -Tail 20"
) else (
    echo Chưa có file log
)
pause
goto menu

:disable
echo ⏸️ Tạm dừng auto-update...
schtasks /change /tn "VoucherManager_AutoUpdate" /disable
echo ✅ Đã tạm dừng
pause
goto menu

:enable
echo ▶️ Kích hoạt auto-update...
schtasks /change /tn "VoucherManager_AutoUpdate" /enable
echo ✅ Đã kích hoạt
pause
goto menu

:delete
echo 🗑️ Xóa auto-update...
set /p confirm="Bạn có chắc muốn xóa? (y/N): "
if /i "%confirm%"=="y" (
    schtasks /delete /tn "VoucherManager_AutoUpdate" /f
    echo ✅ Đã xóa
) else (
    echo ❌ Đã hủy
)
pause
goto menu

:git_status
echo 🔍 Git status:
git status
echo.
echo 📊 Git log (5 commit gần nhất):
git log --oneline -5
pause
goto menu

:exit
echo 👋 Tạm biệt!
exit /b 0