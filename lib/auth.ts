import { SignJWT, jwtVerify } from 'jose';

export interface JWTPayload {
  id: number;
  username: string;
  role: string;
  /** true when the user's role has isSystem=true in the DB */
  isSystem?: boolean;
}

const getSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET || 'atelier-moein-super-secret-jwt-key-2026'
  );

export async function signJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  // 1. Authorization Bearer header
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);

  // 2. HttpOnly cookie
  const cookie = request.headers.get('cookie');
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

export async function getAuthUser(request: Request): Promise<JWTPayload | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyJWT(token);
}

export function isAdmin(user: JWTPayload | null): boolean {
  return user?.role === 'admin' || user?.isSystem === true;
}

export function isEmployee(user: JWTPayload | null): boolean {
  return ['admin', 'employee', 'accountant'].includes(user?.role ?? '');
}
