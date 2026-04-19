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

:: کپی دیتابیس (ساده‌ترین روش)
if not exist ".next\standalone\prisma" mkdir ".next\standalone\prisma" > nul 2>&1
copy /Y "prisma\dev.db" ".next\standalone\prisma\dev.db" > nul 2>&1

echo.
echo ========================================
echo Atelier Moein Server is Running Successfully
echo ========================================
echo.
echo Local:   http://localhost:3000
echo Network: http://192.168.20.232:3000
echo Logs:   %~dp0logs\server.log
echo.
echo Press Ctrl+C to stop the server...
echo.

:: لاگینگ + اجرای سرور
if not exist "logs" mkdir "logs"

cd .next\standalone

set NODE_ENV=production
set PORT=3000
set DATABASE_URL=file:./prisma/dev.db

:: اجرای سرور و ذخیره لاگ همزمان
node server.js > "%~dp0logs\server.log" 2>&1

echo.
echo [INFO] Server stopped.
pause