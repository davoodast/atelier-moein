import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const assignments = await p.ceremonyAssignment.findMany({
  where: { user: { username: 'ali' } },
  include: { user: { select: { id: true, username: true } }, role: { include: { rolePermissions: { include: { permission: true } } } } }
});
console.log('Assignments for ali:', JSON.stringify(assignments, null, 2));

const aliUser = await p.user.findFirst({ where: { username: 'ali' } });
console.log('ali user id:', aliUser?.id);
await p.$disconnect();
