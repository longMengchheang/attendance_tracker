export type UserRole = 'teacher' | 'student';

export interface User {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
}
