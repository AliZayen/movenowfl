// Creates a staff account, or changes the role of an existing one. Run on the server only:
//   npm run staff:create -- you@company.com "Your Name" manager
// Roles: manager | dispatcher | support. The person then sets a password with "Forgot password"
// on the sign-in page (an email code), and every staff sign-in asks for a code by email.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type StaffRole } from '../generated/prisma/client';

const ROLES: StaffRole[] = ['manager', 'dispatcher', 'support'];
const [emailArg, name, role = 'manager'] = process.argv.slice(2);
const email = emailArg?.trim().toLowerCase();

if (!email || !email.includes('@') || !name || !ROLES.includes(role as StaffRole)) {
  console.error('Usage: npm run staff:create -- <email> "<full name>" [manager|dispatcher|support]');
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

(async () => {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing && existing.role !== 'admin') {
    console.error(`${email} is a ${existing.role} account. Staff need their own email address.`);
    process.exitCode = 1;
    return;
  }
  const user = existing
    ? await db.user.update({ where: { id: existing.id }, data: { staffRole: role as StaffRole, disabledAt: null, fullName: name } })
    : await db.user.create({ data: { email, fullName: name, role: 'admin', staffRole: role as StaffRole, preferences: { create: {} } } });
  await db.session.deleteMany({ where: { userId: user.id } });
  await db.auditLog.create({
    data: { action: existing ? 'staff.update' : 'staff.create', targetType: 'user', targetId: user.id, summary: `${existing ? 'Updated' : 'Added'} ${name} (${email}) as ${role} from the command line` },
  });
  console.log(`${existing ? 'Updated' : 'Created'} staff account ${email} (${role}).`);
  if (!user.passwordHash) console.log(`Next: open /signin?mode=forgot&email=${encodeURIComponent(email)} to set a password.`);
})().finally(() => db.$disconnect());
