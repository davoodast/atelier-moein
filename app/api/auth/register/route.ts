import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, isAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser || !isAdmin(authUser)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { username, password, email, phone, position, salary, start_date, role: roleName } = await request.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'نام کاربری و رمز عبور الزامی است' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: 'نام کاربری تکراری است' }, { status: 400 });
  }

  const role = await prisma.role.findFirst({ where: { name: roleName || 'employee' } });
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      email: email || null,
      phone: phone || null,
      role_id: role?.id,
    },
  });

  const employee = await prisma.employee.create({
    data: {
      user_id: user.id,
      position: position || null,
      salary: salary ? parseFloat(salary) : null,
      start_date: start_date || null,
    },
  });

  return NextResponse.json({ user, employee }, { status: 201 });
}
