import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { getEffectivePermissions } from '@/lib/permissions';

export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id as number },
    include: { role: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  const roleName = user.role?.name || 'employee';
  const permissions = await getEffectivePermissions(user.id, roleName);

  return NextResponse.json({
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: roleName,
    isSystem: user.role?.isSystem ?? false,
    bank_account: user.bank_account,
    permissions,
  });
}
