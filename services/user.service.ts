import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, NewUser } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher';
}) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const [newUser] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

  return newUser;
}

export async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user || null;
}

export async function verifyPassword(plainPassword: string, hashedPassword: string) {
  return bcrypt.compare(plainPassword, hashedPassword);
}
