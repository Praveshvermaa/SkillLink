import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const type = searchParams.get('type')

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // Check if this is a password recovery callback
            if (type === 'recovery') {
                // Redirect to reset password page for password recovery
                return NextResponse.redirect(`${origin}/auth/reset-password`)
            }

            // For email verification, sign out and redirect to verified page
            await supabase.auth.signOut()
            return NextResponse.redirect(`${origin}/auth/verified?success=true`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
