import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const type = searchParams.get('type')
    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')

    console.log('Auth callback received:', {
        hasCode: !!code,
        type,
        error,
        error_description,
        origin
    })

    // Handle errors from Supabase
    if (error) {
        console.error('Auth callback error from Supabase:', error, error_description)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error_description || error)}`)
    }

    if (code) {
        try {
            const supabase = await createClient()
            console.log('Attempting to exchange code for session...')

            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

            if (exchangeError) {
                console.error('Code exchange error:', {
                    message: exchangeError.message,
                    status: exchangeError.status,
                    name: exchangeError.name
                })

                // Provide more specific error message
                const errorMsg = exchangeError.message || 'Failed to verify email'
                return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(errorMsg)}`)
            }

            if (data?.session) {
                console.log('Session created successfully for user:', data.user?.email)

                // Check if this is a password recovery callback
                if (type === 'recovery') {
                    console.log('Redirecting to reset password page')
                    return NextResponse.redirect(`${origin}/auth/reset-password`)
                }

                // For email verification (signup), sign out the user so they can see the success page
                // and then log in manually
                console.log('Email verification successful, signing out user to show success page')
                await supabase.auth.signOut()

                return NextResponse.redirect(`${origin}/auth/verified?success=true`)
            } else {
                console.error('No session created after code exchange')
                return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent('No session created')}`)
            }
        } catch (err) {
            console.error('Unexpected error in callback:', err)
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent('Unexpected error occurred')}`)
        }
    }

    // No code provided
    console.error('No verification code provided in callback')
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent('No verification code provided')}`)
}
