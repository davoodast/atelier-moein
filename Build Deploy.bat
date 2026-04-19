@echo off
title Atelier Moein - Build Deploy Package
chcp 65001 > nul
cd /d "%~dp0"

echo.
echo  ========================================
echo   Building Deployment Package...
echo  ========================================
echo.

:: Step 1 - Build
echo [1/5] Building Next.js production bundle...
call npm run build
if errorlevel 1 (
    echo  [ERROR] Build failed.
    pause & exit /b 1
)

:: Step 2 - Prepare deploy folder
echo [2/5] Preparing deploy folder...
if exist "deploy" rmdir /s /q "deploy"
xcopy /E /I /Q ".next\standalone" "deploy" > nul 2>&1

:: Step 3 - Copy static assets
echo [3/5] Copying static assets...
xcopy /E /I /Q ".next\static" "deploy\.next\static" > nul 2>&1
xcopy /E /I /Q "public"       "deploy\public"       > nul 2>&1

:: Step 4 - Copy database
echo [4/5] Copying database...
if not exist "deploy\prisma" mkdir "deploy\prisma"
copy /Y "prisma\prisma\dev.db" "deploy\prisma\dev.db" > nul 2>&1

:: Step 5 - Add launcher scripts inside deploy/
echo [5/5] Creating launchers...

(
echo @echo off
echo title Atelier Moein
echo chcp 65001 ^> nul
echo cd /d "%%~dp0"
echo.
echo for /f "tokens=2 delims=:" %%%%a in ^('ipconfig ^| findstr /c:"IPv4"'^) do ^(
echo     set "LOCAL_IP=%%%%a"
echo     goto :got_ip
echo ^)
echo :got_ip
echo set "LOCAL_IP=%%LOCAL_IP: =%%"
echo.
echo if not exist "logs" mkdir "logs"
echo set LOGFILE=%%~dp0logs\server.log
echo.
echo echo  ========================================
echo echo   Atelier Moein ^- Production Server
echo echo  ========================================
echo echo.
echo echo   Local:   http://localhost:3000
echo echo   Network: http://%%LOCAL_IP%%:3000
echo echo   Logs:    %%LOGFILE%%
echo echo.
echo echo   Press Ctrl+C to stop...
echo echo.
echo set NODE_ENV=production
echo set PORT=3000
echo set DATABASE_URL=file:./prisma/dev.db
echo set COOKIE_SECURE=false
echo node server.js 2^>^&1 ^| powershell -NoProfile -Command "$input ^| Tee-Object -FilePath '%%LOGFILE%%' -Append"
echo if errorlevel 1 pause
) > "deploy\Start.bat"

echo.
echo  ========================================
echo   Deploy package ready at: .\deploy\
echo  ========================================
echo.
echo   To deploy on another machine:
echo     1. Copy the deploy\ folder
echo     2. Make sure Node.js is installed
echo     3. Double-click Start.bat
echo.
pause
