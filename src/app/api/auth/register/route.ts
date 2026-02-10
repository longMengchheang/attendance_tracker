import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

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
    // DUMMY SIGNUP (FOR TESTING) - USES ADMIN API TO GENERATE LINK & LOG OTP
    // =========================================================================
    
    /* 
       NOTES:
       - This block uses `supabaseAdmin.auth.admin.generateLink` to bypass email sending.
       - It logs the OTP to the terminal console.
       - DELETE or COMMENT OUT this block when moving to production.
    */
    
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });

    if (error) {
       console.error('Error generating link:', error);
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

    // Log the OTP to the console
    console.log('GenerateLink Response Data:', JSON.stringify(data, null, 2));

    if (data.properties?.email_otp) {
        console.log('\n================================================================');
        console.log(`🔐 DUMMY VERIFICATION CODE FOR ${email}: ${data.properties.email_otp}`);
        console.log('================================================================\n');
    } else {
        console.log('No OTP returned in generateLink response. Properties:', data.properties);
    }
    
    // =========================================================================
    // END DUMMY SIGNUP
    // =========================================================================


    // =========================================================================
    // PRODUCTION SIGNUP (UNCOMMENT WHEN READY FOR PRODUCTION)
    // =========================================================================
    /*
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
    */
    // =========================================================================
    // END PRODUCTION SIGNUP
    // =========================================================================

    // Create profile in users table - MOVED to verify-otp
    // We now only create the user record after email verification
    // if (data.user) { ... }

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
