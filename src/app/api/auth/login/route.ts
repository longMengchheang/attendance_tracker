import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

import { supabaseAdmin } from '@/lib/supabase-admin';

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
    // We still use the regular client for Auth to get the user session
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
    // USE ADMIN CLIENT TO BYPASS RLS
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // If user not found in public table (but auth is successful), create them
    let finalProfile = userProfile;
    if (!userProfile && data.user) {
      console.log('User missing from public table, creating...', data.user.id);
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: data.user.id,
          name: data.user.user_metadata?.name || 'User',
          role: data.user.user_metadata?.role || 'student',
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Failed to auto-create user profile:', insertError);
        // We continue anyway, as the login itself was successful
      } else {
        finalProfile = newProfile;
      }
    }

    return NextResponse.json({
      message: 'Login successful',
      user: data.user,
      session: data.session,
      profile: finalProfile,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
