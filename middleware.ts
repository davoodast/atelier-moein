import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // --- Protect /admin and /employee ---
  if (pathname.startsWith('/admin') || pathname.startsWith('/employee')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const user = await verifyJWT(token);
    if (!user) {
      const res = NextResponse.redirect(new URL('/login', request.url));
      res.cookies.delete('token');
      return res;
    }
    // Role check for /admin
    if (pathname.startsWith('/admin') && !['admin', 'accountant'].includes(user.role)) {
      return NextResponse.redirect(new URL('/employee', request.url));
    }
    // Role check for /employee
    if (pathname.startsWith('/employee') && !['admin', 'employee', 'accountant'].includes(user.role)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // --- Redirect logged-in users away from /login ---
  if (pathname === '/login' && token) {
    const user = await verifyJWT(token);
    if (user) {
      const dest = ['admin', 'accountant'].includes(user.role) ? '/admin' : '/employee';
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/employee/:path*', '/login'],
};
