/**
 * build-deploy.js
 * ---------------
 * Builds the Next.js project and packages everything needed to run
 * the production server into a single "deploy/" folder.
 *
 * Usage:
 *   node scripts/build-deploy.js
 *
 * Output: deploy/ folder ready to copy to any Windows machine with Node.js.
 * On the target machine: double-click "deploy/Start.bat"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEPLOY = path.join(ROOT, 'deploy');

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// ── 1. Build ────────────────────────────────────────────────────────────────
console.log('\n=======================================');
console.log('  Building Next.js (standalone mode)...');
console.log('=======================================\n');
run('npm run build');

// ── 2. Clean previous deploy ─────────────────────────────────────────────────
console.log('\n[1/5] Cleaning previous deploy folder...');
if (fs.existsSync(DEPLOY)) fs.rmSync(DEPLOY, { recursive: true, force: true });
fs.mkdirSync(DEPLOY, { recursive: true });

// ── 3. Copy standalone server ────────────────────────────────────────────────
console.log('[2/5] Copying standalone server...');
copyDir(path.join(ROOT, '.next', 'standalone'), DEPLOY);

// ── 4. Copy static assets ─────────────────────────────────────────────────────
console.log('[3/5] Copying .next/static...');
copyDir(
  path.join(ROOT, '.next', 'static'),
  path.join(DEPLOY, '.next', 'static')
);

// ── 5. Copy public folder ─────────────────────────────────────────────────────
console.log('[4/5] Copying public folder...');
copyDir(path.join(ROOT, 'public'), path.join(DEPLOY, 'public'));

// ── 6. Copy SQLite database ───────────────────────────────────────────────────
// Prisma resolves DATABASE_URL "file:./prisma/dev.db" relative to its own CWD
// which inside standalone is: deploy/prisma/
// So Prisma will look for: deploy/prisma/prisma/dev.db
console.log('[5/5] Copying SQLite database...');
const dbSrc = path.join(ROOT, 'prisma', 'prisma', 'dev.db');
const dbDest = path.join(DEPLOY, 'prisma', 'dev.db');
fs.mkdirSync(path.dirname(dbDest), { recursive: true });
fs.copyFileSync(dbSrc, dbDest);

// ── 7. Write Start.bat inside deploy ─────────────────────────────────────────
console.log('\nWriting deploy/Start.bat...');
const startBat = `@echo off
title Atelier Moein - Production Server
chcp 65001 > nul
cd /d "%~dp0"

:: Kill previous server on port 3000
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%p > nul 2>&1
)

:: Build ABSOLUTE path for DATABASE_URL
:: Prisma SQLite on Windows requires "file:C:/path" format (forward slashes, no triple-slash)
set "_DB=%~dp0prisma\\dev.db"
set "_DB=%_DB:\\=/%"
set "DATABASE_URL=file:%_DB%"

set "LOCAL_IP=localhost"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "LOCAL_IP=%%a"
    goto :got_ip
)
:got_ip
set "LOCAL_IP=%LOCAL_IP: =%"

echo.
echo  ========================================
echo   Atelier Moein - Production Server
echo  ========================================
echo.
echo   Local:   http://localhost:3000
echo   Network: http://%LOCAL_IP%:3000
echo.
echo   To stop: close this window or Ctrl+C
echo.

set NODE_ENV=production
set PORT=3000
set COOKIE_SECURE=false

node server.js
if errorlevel 1 pause
`;
fs.writeFileSync(path.join(DEPLOY, 'Start.bat'), startBat, 'utf-8');

// ── Done ──────────────────────────────────────────────────────────────────────
const deploySize = getDirSizeMB(DEPLOY);
console.log('\n=======================================');
console.log('  Deploy package ready!');
console.log(`  Folder: deploy/   (${deploySize} MB)`);
console.log('=======================================');
console.log('\nHow to use:');
console.log('  1. Copy the "deploy/" folder to the target machine');
console.log('  2. Make sure Node.js is installed on that machine');
console.log('  3. Double-click Start.bat');
console.log('  4. Open http://localhost:3000\n');

function getDirSizeMB(dir) {
  let total = 0;
  function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else total += fs.statSync(full).size;
    }
  }
  walk(dir);
  return (total / 1024 / 1024).toFixed(1);
}
