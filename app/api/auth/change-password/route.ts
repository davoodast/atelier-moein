import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'رمز فعلی و رمز جدید الزامی است' }, { status: 400 });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return NextResponse.json({ error: 'رمز جدید باید حداقل ۶ کاراکتر باشد' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: authUser.id as number } });
  if (!user) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return NextResponse.json({ error: 'رمز فعلی اشتباه است' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: authUser.id as number },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ message: 'رمز عبور با موفقیت تغییر یافت' });
}
