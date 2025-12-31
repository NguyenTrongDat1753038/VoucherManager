@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
echo 🔍 KIỂM TRA MÔI TRƯỜNG PRODUCTION

echo.
echo 📋 System Information:
echo =====================
systeminfo | findstr /C:"OS Name" /C:"Total Physical Memory" /C:"Available Physical Memory"

echo.
echo 🐳 Docker Information:
echo =====================
docker --version
docker-compose --version
docker system df

echo.
echo 🌐 Network Information:
echo ======================
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "IP_TEMP=%%a"
    set "INTERNAL_IP=!IP_TEMP: =!"
    echo Internal IP: !INTERNAL_IP!
    goto :found_ip
)
:found_ip

echo.
echo 📁 Project Information:
echo ======================
echo Current Directory: %CD%
if exist ".git" (
    echo Git Repository: ✅
    git branch --show-current
    git log --oneline -1
) else (
    echo Git Repository: ❌
)

echo.
echo 📄 Configuration Files:
echo =======================
if exist "docker-compose.yml" (echo docker-compose.yml: ✅) else (echo docker-compose.yml: ❌)
if exist ".env.production" (echo .env.production: ✅) else (echo .env.production: ❌)
if exist ".env.internal" (echo .env.internal: ✅) else (echo .env.internal: ❌)
if exist "package.json" (echo package.json: ✅) else (echo package.json: ❌)

echo.
echo 🔧 Services Status:
echo ==================
docker-compose ps

echo.
echo 💾 Disk Space:
echo ==============
powershell -Command "$drive = Get-PSDrive C; [Math]::Round($drive.Free / 1GB, 2)" > temp_free.txt
set /p FREE_GB=<temp_free.txt
del temp_free.txt
echo Free Space (C:): %FREE_GB% GB

echo.
echo 🏥 Health Check:
echo ===============
if not "!INTERNAL_IP!"=="" (
    curl -s -o nul -w "HTTP Status: %%{http_code}" http://!INTERNAL_IP!:8080/api/health
) else (
    echo ❌ Cannot perform health check: No Internal IP found
)
echo.

echo.
echo 📊 Resource Usage:
echo =================
powershell -Command "$cpu = Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average | Select-Object -ExpandProperty Average; Write-Host ('CPU Usage: {0}%%' -f $cpu)"
powershell -Command "$os = Get-CimInstance Win32_OperatingSystem; $total = $os.TotalVisibleMemorySize; $free = $os.FreePhysicalMemory; $usage = [Math]::Round((($total - $free) / $total) * 100, 2); $usedGB = [Math]::Round(($total-$free)/1MB, 2); $totalGB = [Math]::Round($total/1MB, 2); Write-Host ('RAM Usage: {0}%% ({1}GB / {2}GB)' -f $usage, $usedGB, $totalGB)"

echo.
echo 🔒 Security Check:
echo =================
echo Checking for sensitive files...
if exist ".env" (echo ⚠️ .env file found - should not be in production) else (echo ✅ No .env file)
if exist "node_modules" (echo ⚠️ node_modules found - consider using Docker build) else (echo ✅ No node_modules)

echo.
echo 🏁 Environment check completed!
