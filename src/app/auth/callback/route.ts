import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const type = searchParams.get('type')
    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')

    // Handle errors from Supabase
    if (error) {
        console.error('Auth callback error:', error, error_description)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error_description || error)}`)
    }

    if (code) {
        const supabase = await createClient()
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (!exchangeError) {
            // Check if this is a password recovery callback
            if (type === 'recovery') {
                // Redirect to reset password page for password recovery
                return NextResponse.redirect(`${origin}/auth/reset-password`)
            }

            // For email verification (signup), redirect to verified page
            // Don't sign out - let them stay logged in
            return NextResponse.redirect(`${origin}/auth/verified?success=true`)
        }

        console.error('Code exchange error:', exchangeError)
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
