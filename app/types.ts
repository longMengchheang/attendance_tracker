export type UserRole = 'teacher' | 'student';

export interface User {
  name: string;
  email: string;
  role: UserRole;
}
