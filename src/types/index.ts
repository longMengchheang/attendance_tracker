export type UserRole = 'teacher' | 'student';

export interface User {
  id?: string;
  name: string | null;
  email: string;
  role: UserRole;
}
