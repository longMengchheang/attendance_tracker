import { NextResponse } from 'next/server';
import { createUser } from '@/services/user.service';

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (role !== 'student' && role !== 'teacher') {
      return NextResponse.json(
        { error: 'Role must be either student or teacher' },
        { status: 400 }
      );
    }

    const user = await createUser({ name, email, password, role });

    return NextResponse.json(
      { message: 'User registered successfully', user },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
