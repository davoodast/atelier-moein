@echo off
chcp 65001 > nul
echo ============================================
echo         آتلیه معین - راه‌اندازی سیستم
echo ============================================
echo.

:: Change to script directory
cd /d "%~dp0"

:: Check Node.js
node --version > nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js نصب نیست. لطفاً Node.js را نصب کنید.
    pause
    exit /b 1
)

:: Install dependencies if node_modules missing
if not exist "node_modules" (
    echo [1/4] نصب وابستگی‌ها...
    call npm install
    if errorlevel 1 ( echo [ERROR] خطا در نصب وابستگی‌ها & pause & exit /b 1 )
) else (
    echo [1/4] وابستگی‌ها موجود هستند.
)

:: Generate Prisma client
echo [2/4] آماده‌سازی Prisma Client...
call npx prisma generate > nul 2>&1

:: Push DB schema (creates DB if not exists)
echo [3/4] راه‌اندازی پایگاه داده...
call npx prisma db push > nul 2>&1
if errorlevel 1 (
    echo [ERROR] خطا در راه‌اندازی پایگاه داده
    pause
    exit /b 1
)

:: Seed DB if empty (seed is idempotent via upsert)
echo [4/4] بارگذاری داده‌های اولیه...
call npx tsx prisma/seed.ts > nul 2>&1

echo.
echo ============================================
echo  سایت در حال راه‌اندازی است...
echo  آدرس: http://localhost:3000
echo ============================================
echo.

:: Start dev server
call npm run dev
