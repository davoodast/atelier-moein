import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// Returns all users — used for ceremony assignment dropdowns.
// Any authenticated user can fetch this (assignment permission is checked server-side on POST).
export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, phone: true },
    orderBy: { username: 'asc' },
  });

  return NextResponse.json(users);
}
