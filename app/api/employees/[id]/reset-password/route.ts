import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only super_admin (role === 'admin') can reset passwords without old password
  if (authUser.role !== 'admin') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
  }

  const { id } = await params;
  const { newPassword } = await request.json();

  if (!newPassword || newPassword.length < 4) {
    return NextResponse.json({ error: 'رمز عبور باید حداقل ۴ کاراکتر باشد' }, { status: 400 });
  }

  const employee = await prisma.employee.findUnique({
    where: { id: parseInt(id) },
    select: { user_id: true },
  });

  if (!employee) return NextResponse.json({ error: 'کارمند یافت نشد' }, { status: 404 });

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: employee.user_id },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ success: true });
}
