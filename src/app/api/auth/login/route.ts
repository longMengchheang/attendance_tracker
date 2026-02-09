import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sign in with Password using Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    // Check if user exists in public users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .single();

    // If user not found in public table (but auth is successful), create them
    if (!userProfile && data.user) {
      console.log('User missing from public table, creating...', data.user.id);
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          name: data.user.user_metadata?.name || 'User',
          role: data.user.user_metadata?.role || 'student',
        });
      
      if (insertError) {
        console.error('Failed to auto-create user profile:', insertError);
        // We continue anyway, as the login itself was successful, 
        // but subsequent operations might fail (like joining class)
      }
    }

    return NextResponse.json({
      message: 'Login successful',
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
