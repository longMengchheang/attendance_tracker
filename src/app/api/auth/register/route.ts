import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    if (role !== 'student' && role !== 'teacher') {
      return NextResponse.json(
        { error: 'Role must be either student or teacher' },
        { status: 400 }
      );
    }

    // =========================================================================
    // PRODUCTION SIGNUP
    // =========================================================================
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role, // ensure 'role' is passed if you rely on it in triggers/metadata
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    // =========================================================================
    // END PRODUCTION SIGNUP
    // =========================================================================

    return NextResponse.json({
      message: 'Registration successful. Please check your email to verify your account.',
      email,
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
