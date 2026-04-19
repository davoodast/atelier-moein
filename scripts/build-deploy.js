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
const dbDest = path.join(DEPLOY, 'prisma', 'prisma', 'dev.db');
fs.mkdirSync(path.dirname(dbDest), { recursive: true });
fs.copyFileSync(dbSrc, dbDest);

// ── 7. Write Start.bat inside deploy ─────────────────────────────────────────
console.log('\nWriting deploy/Start.bat...');
const startBat = `@echo off
title Atelier Moein - Production Server
chcp 65001 > nul
cd /d "%~dp0"

echo.
echo  ========================================
echo   Atelier Moein - Production Server
echo  ========================================
echo.

:: Detect local network IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "LOCAL_IP=%%a"
    goto :got_ip
)
:got_ip
set "LOCAL_IP=%LOCAL_IP: =%"

if not exist "logs" mkdir "logs"
set LOGFILE=%~dp0logs\\server.log

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

set NODE_ENV=production
set PORT=3000
set COOKIE_SECURE=false

node server.js 2>&1 | powershell -NoProfile -Command "\`$input | Tee-Object -FilePath '%LOGFILE%' -Append"
`;
fs.writeFileSync(path.join(DEPLOY, 'Start.bat'), startBat, 'ascii');

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
