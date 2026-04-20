import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

// Middleware runs in Edge runtime – only console.log is available here.
// File-based logging is handled inside the Node.js API routes (not here).
function logRequest(request: NextRequest, tag = '') {
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const ua = (request.headers.get('user-agent') || '-').slice(0, 80);
  const line = `[${new Date().toISOString()}] ${request.method} ${request.nextUrl.pathname} | IP:${ip} | ${ua} ${tag}`;
  console.log(line);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  logRequest(request);

  // --- Protect /admin, /employee, /settings ---
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/employee') ||
    pathname.startsWith('/settings')
  ) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const user = await verifyJWT(token);
    if (!user) {
      const res = NextResponse.redirect(new URL('/login', request.url));
      res.cookies.delete('token');
      return res;
    }
    // Role check for /admin: only admin/accountant roles or isSystem users
    if (pathname.startsWith('/admin') && !['admin', 'accountant'].includes(user.role) && !user.isSystem) {
      return NextResponse.redirect(new URL('/employee', request.url));
    }
    // /employee and /settings: any authenticated user is allowed
    // (access control is enforced at the page/API level)
  }

  // --- Redirect logged-in users away from /login ---
  if (pathname === '/login' && token) {
    const user = await verifyJWT(token);
    if (user) {
      const dest = ['admin', 'accountant'].includes(user.role) || user.isSystem ? '/admin' : '/employee';
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/employee/:path*', '/settings/:path*', '/login'],
};
