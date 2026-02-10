import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, token, type = 'email' } = await request.json();

    // Validation
    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    // Map client-side types to Supabase types
    let otpType: 'signup' | 'email' | 'recovery' | 'magiclink' = 'email';
    
    if (type === 'signup') otpType = 'signup';
    else if (type === 'recovery') otpType = 'recovery';
    else if (type === 'magiclink') otpType = 'magiclink';
    
    // Verify OTP with Supabase
    // Note: for recovery, email is required.
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: otpType,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 400 }
      );
    }

    // Get user profile
    // Get user profile or create if not exists (this is the new flow)
    let { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      // Create profile now that email is verified
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          name: data.user.user_metadata?.name || 'User',
          role: (data.user.user_metadata?.role as 'student' | 'teacher') || 'student',
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating user profile after verification:', createError);
        // We might want to return an error here, but technically auth succeeded
        // Let's assume for now it's okay or we can retry later.
        // But for consistency let's try to proceed.
      } else {
        profile = newProfile;
      }
    }

    return NextResponse.json({
      message: 'Verification successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.user_metadata?.name,
        role: profile?.role || data.user.user_metadata?.role,
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
