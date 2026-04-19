@echo off
title Atelier Moein - Production Server
chcp 65001 > nul
cd /d "%~dp0"

echo ========================================
echo     Atelier Moein - Production Server
echo ========================================
echo.

:: اگر بیلد وجود نداشت، اول بیلد بگیر
if not exist ".next\standalone\server.js" (
    echo [INFO] Production build not found. Building now...
    echo.
    call npm run build
    if errorlevel 1 (
        echo [ERROR] Build failed!
        pause
        exit /b 1
    )
)

:: کپی فایل‌های مورد نیاز
echo [INFO] Copying assets...
if not exist ".next\standalone\.next\static" (
    xcopy /E /I /Q ".next\static" ".next\standalone\.next\static" > nul 2>&1
)
if not exist ".next\standalone\public" (
    xcopy /E /I /Q "public" ".next\standalone\public" > nul 2>&1
)

:: کپی دیتابیس — مسیر واقعی: prisma\prisma\dev.db
if not exist ".next\standalone\prisma" mkdir ".next\standalone\prisma" > nul 2>&1
copy /Y "prisma\prisma\dev.db" ".next\standalone\prisma\dev.db" > nul 2>&1

:: تشخیص خودکار IP شبکه
set "LOCAL_IP=localhost"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "LOCAL_IP=%%a"
    goto :got_ip
)
:got_ip
set "LOCAL_IP=%LOCAL_IP: =%"

:: لاگینگ
if not exist "logs" mkdir "logs"
set LOGFILE=%~dp0logs\server.log

echo.
echo ========================================
echo  Atelier Moein Server is Running Successfully
echo ========================================
echo.
echo  Local:   http://localhost:3000
echo  Network: http://%LOCAL_IP%:3000
echo  Logs:    %LOGFILE%
echo.
echo  Press Ctrl+C to stop the server...
echo.

cd .next\standalone

set NODE_ENV=production
set PORT=3000
set DATABASE_URL=file:./prisma/dev.db

:: اجرای سرور — خروجی هم در کنسول و هم در فایل لاگ
node server.js 2>&1 | powershell -NoProfile -Command "$input | Tee-Object -FilePath '%LOGFILE%' -Append"

echo.
echo [INFO] Server stopped.
pause