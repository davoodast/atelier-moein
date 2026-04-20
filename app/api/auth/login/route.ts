import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signJWT } from '@/lib/auth';
import { getEffectivePermissions } from '@/lib/permissions';
import bcrypt from 'bcryptjs';
import { mkdirSync, appendFileSync } from 'fs';

function writeLog(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(line.trimEnd());
  try {
    mkdirSync('logs', { recursive: true });
    appendFileSync('logs/access.log', line);
  } catch {}
}

export async function POST(request: Request) {
  const ip =
    (request as any).headers?.get?.('x-forwarded-for') ||
    (request as any).headers?.get?.('x-real-ip') ||
    'unknown';
  const ua = ((request as any).headers?.get?.('user-agent') || '-').slice(0, 80);

  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'نام کاربری و رمز عبور الزامی است' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });

    if (!user) {
      writeLog(`LOGIN FAIL  user="${username}" IP:${ip} UA:${ua}`);
      return NextResponse.json({ error: 'نام کاربری یا رمز عبور اشتباه است' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      writeLog(`LOGIN FAIL  user="${username}" IP:${ip} UA:${ua}`);
      return NextResponse.json({ error: 'نام کاربری یا رمز عبور اشتباه است' }, { status: 401 });
    }

    const roleName = user.role?.name || 'employee';
    const isSystem = user.role?.isSystem ?? false;
    const permissions = await getEffectivePermissions(user.id, roleName);
    const token = await signJWT({
      id: user.id,
      username: user.username,
      role: roleName,
      isSystem,
    });

    writeLog(`LOGIN OK    user="${username}" role=${roleName} IP:${ip} UA:${ua}`);

    const responseData = {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: roleName,
      isSystem,
      bank_account: user.bank_account,
      permissions,
    };

    const response = NextResponse.json({ user: responseData });
    response.cookies.set('token', token, {
      httpOnly: true,
      // COOKIE_SECURE=true only when serving over HTTPS.
      // For local-network HTTP deployments keep it false so mobile browsers store the cookie.
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch {
    writeLog(`LOGIN ERROR IP:${ip} UA:${ua}`);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
