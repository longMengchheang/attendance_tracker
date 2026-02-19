import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing sessions.
            }
          },
        },
      }
    );
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Forward to next page or dashboard
      return NextResponse.redirect(`${origin}${next}`);
    } else {
        console.error('Exchange Code Error:', error);
        return NextResponse.redirect(`${origin}/login?error=exchange_error&details=${encodeURIComponent(error.message)}`);
    }
  }

  // Return the user to an error page with instructions
  const errorCode = code ? 'exchange_failed' : 'no_code';
  const errorMessage = code ? 'Failed to exchange code for session' : 'No code provided';
  return NextResponse.redirect(`${origin}/login?error=${errorCode}&message=${encodeURIComponent(errorMessage)}`);
}
