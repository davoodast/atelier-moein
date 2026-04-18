import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, isAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const employees = await prisma.employee.findMany({
    include: { user: { include: { role: true } } },
    orderBy: { id: 'asc' },
  });

  const result = employees.map((e) => ({
    id: e.id,
    user_id: e.user_id,
    username: e.user?.username || '',
    email: e.user?.email || null,
    phone: e.user?.phone || null,
    bank_account: e.user?.bank_account || null,
    position: e.position,
    salary: e.salary,
    status: e.status,
    start_date: e.start_date,
    role: e.user?.role?.name || 'employee',
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser || !isAdmin(authUser)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  const { username, password, email, phone, position, salary, start_date, status } = data;

  if (!username || !password) {
    return NextResponse.json({ error: 'نام کاربری و رمز عبور الزامی است' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: 'نام کاربری تکراری است' }, { status: 400 });
  }

  const role = await prisma.role.findFirst({ where: { name: 'employee' } });
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
      status: status || 'active',
    },
  });

  return NextResponse.json({
    id: employee.id,
    user_id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    position: employee.position,
    salary: employee.salary,
    status: employee.status,
    start_date: employee.start_date,
    role: 'employee',
  }, { status: 201 });
}
