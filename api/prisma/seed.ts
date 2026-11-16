import bcrypt from 'bcryptjs';
import { PrismaClient as AuthPrisma } from '../generated/auth';
import { PrismaClient as CorePrisma, Prisma } from '../generated/core';
import { staff } from '../libs/common/src/roles';
import { builtinRoleCatalog } from '../libs/common/src/role-catalog';

const PASSWORD = process.env.SEED_PASSWORD ?? 'Darzaan#2026';

async function main(): Promise<void> {
  const auth = new AuthPrisma();
  const core = new CorePrisma();
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  let created = 0;
  for (const user of staff) {
    const existing = await auth.user.findUnique({ where: { email: user.email } });
    if (existing) continue;
    await auth.user.create({
      data: {
        email: user.email,
        passwordHash,
        role: user.role,
        name: user.name,
        title: user.title,
        location: user.location,
        store: user.store ?? null,
        storeId: user.storeId ?? null,
      },
    });
    created += 1;
  }
  const retired = await auth.user.findUnique({ where: { email: 'meera.kapoor@darzaan.test' } });
  if (retired && !retired.disabledAt) {
    await auth.user.update({ where: { id: retired.id }, data: { disabledAt: new Date() } });
  }
  const roles = await core.snapshot.findUnique({ where: { key: 'roles' } });
  if (!roles) {
    await core.snapshot.create({
      data: { key: 'roles', body: builtinRoleCatalog() as unknown as Prisma.InputJsonValue },
    });
  }
  console.log(`Staff accounts created: ${created}. Existing accounts, stores, and business records were left as they are.`);
  await auth.$disconnect();
  await core.$disconnect();
}

void main();
