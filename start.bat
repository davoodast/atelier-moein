@echo off
title Atelier Moein - Development
chcp 65001 > nul
cd /d "%~dp0"

echo.
echo  ============================================
echo    Atelier Moein - Development Server
echo  ============================================
echo.

:: --- Kill any previous server on port 3000 ---
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    echo  [CLEANUP] Killing previous process on port 3000 (PID: %%p)...
    taskkill /F /PID %%p > nul 2>&1
)

:: --- Check Node.js ---
node --version > nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js is not installed.
    pause
    exit /b 1
)

:: --- Install dependencies ---
if not exist "node_modules" (
    echo  [1/4] Installing dependencies...
    call npm install
    if errorlevel 1 ( echo  [ERROR] npm install failed & pause & exit /b 1 )
) else (
    echo  [1/4] Dependencies OK.
)

:: --- Generate Prisma Client ---
echo  [2/4] Generating Prisma Client...
call npx prisma generate > nul 2>&1

:: --- Create / sync database ---
echo  [3/4] Setting up database...
call npx prisma db push > nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Database setup failed.
    pause
    exit /b 1
)

:: --- Seed (idempotent) ---
echo  [4/4] Seeding database...
call npx tsx prisma/seed.ts > nul 2>&1

echo.
echo  ============================================
echo   http://localhost:3000
echo   Press Ctrl+C to stop the server.
echo  ============================================
echo.

:: --- Start dev server (node is child of this CMD window) ---
call npm run dev

echo.
echo  [INFO] Server stopped.
pause
