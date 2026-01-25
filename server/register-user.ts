import { getDb } from './db';
import { users } from '../drizzle/schema';
import { hashPassword } from './auth-helpers';

/**
 * Helper script to register a new user with email/password
 * Usage: node -r tsx/cjs register-user.ts
 */
export async function registerUser(email: string, password: string, name: string, role: 'admin' | 'tech' = 'tech') {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const hashedPassword = await hashPassword(password);

  await db.insert(users).values({
    openId: `email-${email}`,
    email,
    password: hashedPassword,
    name,
    role,
    loginMethod: 'email',
  });

  console.log(`User ${email} registered successfully with role ${role}`);
}

// If run directly, register a test user
if (import.meta.url === `file://${process.argv[1]}`) {
  const email = process.argv[2] || 'admin@ewandf.ca';
  const password = process.argv[3] || 'admin123';
  const name = process.argv[4] || 'Admin User';
  const role = (process.argv[5] as 'admin' | 'tech') || 'admin';

  registerUser(email, password, name, role)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Registration failed:', error);
      process.exit(1);
    });
}
