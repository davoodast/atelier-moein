@echo off
title Atelier Moein - Build Deploy Package
chcp 65001 > nul
cd /d "%~dp0"

echo.
echo  ========================================
echo   Building Deployment Package...
echo  ========================================
echo.

:: --- Step 1: Build ---
echo  [1/6] Building Next.js production bundle...
call npm run build
if errorlevel 1 (
    echo  [ERROR] Build failed.
    pause
    exit /b 1
)

:: --- Step 2: Clean and copy standalone ---
echo  [2/6] Preparing deploy folder...
if exist "deploy" rmdir /s /q "deploy"
xcopy /E /I /Q ".next\standalone" "deploy" > nul 2>&1

:: --- Step 3: Copy static assets ---
echo  [3/6] Copying static assets...
xcopy /E /I /Q ".next\static" "deploy\.next\static" > nul 2>&1
xcopy /E /I /Q "public"       "deploy\public"        > nul 2>&1

:: --- Step 4: Copy next module (required on target machine) ---
echo  [4/6] Copying next module...
if not exist "deploy\node_modules\next" xcopy /E /I /Q "node_modules\next" "deploy\node_modules\next" > nul 2>&1

:: --- Step 5: Copy database ---
echo  [5/6] Copying database...
if not exist "prisma\prisma\dev.db" (
    echo  [ERROR] Database not found at prisma\prisma\dev.db
    echo  [ERROR] Run start.bat first to create the database.
    pause
    exit /b 1
)
if not exist "deploy\prisma" mkdir "deploy\prisma"
copy /Y "prisma\prisma\dev.db" "deploy\prisma\dev.db" > nul 2>&1

:: --- Step 6: Create launchers inside deploy ---
echo  [6/6] Creating launchers...

(
    echo @echo off
    echo title Atelier Moein - Production Server
    echo chcp 65001 ^> nul
    echo cd /d "%%~dp0"
    echo.
    echo :: Kill previous server on port 3000
    echo for /f "tokens=5" %%%%p in ^('netstat -ano ^^^| findstr ":3000 " ^^^| findstr "LISTENING"'^) do ^(
    echo     taskkill /F /PID %%%%p ^> nul 2^>^&1
    echo ^)
    echo.
    echo set "LOCAL_IP=localhost"
    echo for /f "tokens=2 delims=:" %%%%a in ^('ipconfig ^^^| findstr /c:"IPv4"'^) do ^(
    echo     set "LOCAL_IP=%%%%a"
    echo     goto :got_ip
    echo ^)
    echo :got_ip
    echo set "LOCAL_IP=%%LOCAL_IP: =%%"
    echo.
    echo echo.
    echo echo  ========================================
    echo echo   Atelier Moein - Production Server
    echo echo  ========================================
    echo echo.
    echo echo   Local:   http://localhost:3000
    echo echo   Network: http://%%LOCAL_IP%%:3000
    echo echo.
    echo echo   To stop: use Kill Server.bat or Ctrl+C
    echo echo.
    echo.
    echo set NODE_ENV=production
    echo set PORT=3000
    echo set DATABASE_URL=file:./prisma/dev.db
    echo set COOKIE_SECURE=false
    echo node server.js
    echo if errorlevel 1 pause
) > "deploy\Start.bat"

(
    echo @echo off
    echo title Atelier Moein - Kill Server
    echo chcp 65001 ^> nul
    echo echo.
    echo echo  Stopping Atelier Moein server on port 3000...
    echo set "FOUND="
    echo for /f "tokens=5" %%%%p in ^('netstat -ano ^^^| findstr ":3000 " ^^^| findstr "LISTENING"'^) do ^(
    echo     taskkill /F /PID %%%%p ^> nul 2^>^&1
    echo     set "FOUND=1"
    echo ^)
    echo if defined FOUND ^(
    echo     echo  Server stopped successfully.
    echo ^) else ^(
    echo     echo  No server found running on port 3000.
    echo ^)
    echo echo.
    echo timeout /t 2 ^> nul
) > "deploy\Kill Server.bat"

:: --- Verify output ---
if not exist "deploy\.next\static" (
    echo  [ERROR] Static files missing from deploy!
    pause & exit /b 1
)
if not exist "deploy\prisma\dev.db" (
    echo  [ERROR] Database missing from deploy!
    pause & exit /b 1
)

echo.
echo  ========================================
echo   Deploy package ready at: .\deploy\
echo  ========================================
echo.
echo   Verified contents:
for %%f in ("deploy\.next\static" "deploy\public" "deploy\prisma\dev.db" "deploy\node_modules\next" "deploy\Start.bat" "deploy\Kill Server.bat" "deploy\server.js") do (
    if exist "%%~f" (echo     [OK] %%~f) else (echo     [MISSING] %%~f)
)
echo.
echo   Usage on target machine:
echo     - Double-click Start.bat  to start the server
echo     - Double-click Kill Server.bat  to stop it
echo.
pause
