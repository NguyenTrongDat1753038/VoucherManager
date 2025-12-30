@echo off
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
    set INTERNAL_IP=%%a
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
for /f "tokens=3" %%i in ('dir /-c ^| find "bytes free"') do (
    set /a FREE_GB=%%i/1073741824
    echo Free Space: !FREE_GB! GB
)

echo.
echo 🏥 Health Check:
echo ===============
curl -s -o nul -w "HTTP Status: %%{http_code}" http://%INTERNAL_IP: =%:8080/api/health
echo.

echo.
echo 📊 Resource Usage:
echo =================
wmic cpu get loadpercentage /value | findstr LoadPercentage
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value | findstr /C:"TotalVisibleMemorySize" /C:"FreePhysicalMemory"

echo.
echo 🔒 Security Check:
echo =================
echo Checking for sensitive files...
if exist ".env" (echo ⚠️ .env file found - should not be in production) else (echo ✅ No .env file)
if exist "node_modules" (echo ⚠️ node_modules found - consider using Docker build) else (echo ✅ No node_modules)

echo.
echo 🏁 Environment check completed!