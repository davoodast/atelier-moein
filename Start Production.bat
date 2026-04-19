@echo off
title Atelier Moein - Production Server
chcp 65001 > nul
cd /d "%~dp0"

echo.
echo  ========================================
echo   Atelier Moein - Production Server
echo  ========================================
echo.

:: Build if standalone not present
if not exist ".next\standalone\server.js" (
    echo  [INFO]  Production build not found. Building now...
    call npm run build
    if errorlevel 1 ( echo  [ERROR] Build failed. & pause & exit /b 1 )
)

:: Detect local network IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "LOCAL_IP=%%a"
    goto :got_ip
)
:got_ip
set "LOCAL_IP=%LOCAL_IP: =%"

:: Always sync static + public into standalone
xcopy /E /I /Y /Q ".next\static"  ".next\standalone\.next\static"  > nul 2>&1
xcopy /E /I /Y /Q "public"        ".next\standalone\public"        > nul 2>&1

:: Copy SQLite DB to exact Prisma-resolved path
if not exist ".next\standalone\prisma\prisma" mkdir ".next\standalone\prisma\prisma"
copy /Y "prisma\prisma\dev.db" ".next\standalone\prisma\prisma\dev.db" > nul 2>&1

:: Prepare logs
if not exist "logs" mkdir "logs"
set LOGFILE=%~dp0logs\server.log

echo  Starting production server...
echo.
echo  ========================================
echo   Atelier Moein Server is Running Successfully
echo  ========================================
echo.
echo   Local:   http://localhost:3000
echo   Network: http://%LOCAL_IP%:3000
echo.
echo   Logs:    %LOGFILE%
echo   Press Ctrl+C to stop the server...
echo.

:: COOKIE_SECURE=false - lets mobile browsers on HTTP store the auth cookie
set NODE_ENV=production
set PORT=3000
set COOKIE_SECURE=false

cd .next\standalone
node server.js 2>&1 | powershell -NoProfile -Command "`$input | Tee-Object -FilePath '%LOGFILE%' -Append"
