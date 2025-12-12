import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })



    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Define auth pages that don't require verification
    const publicAuthPages = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/callback', '/auth/verified', '/auth/auth-code-error'];
    const isPublicAuthPage = publicAuthPages.some(page => request.nextUrl.pathname.startsWith(page));
    const isResetPasswordPage = request.nextUrl.pathname.startsWith('/auth/reset-password');

    // If no user and trying to access protected pages, redirect to login
    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/auth') &&
        request.nextUrl.pathname !== '/'
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
    }

    // If user exists but email is not verified
    if (user && !user.email_confirmed_at) {
        // Allow access to public auth pages and reset password
        if (!isPublicAuthPage && !isResetPasswordPage && request.nextUrl.pathname !== '/') {
            // Redirect unverified users to a verification pending page
            const url = request.nextUrl.clone()
            url.pathname = '/auth/verified'
            return NextResponse.redirect(url)
        }
    }

    // If user is authenticated and verified, redirect from auth pages to dashboard
    // BUT allow them to see the verified success page when coming from email confirmation
    if (user && user.email_confirmed_at) {
        // Allow verified page with success parameter to show
        const isVerifiedSuccessPage = request.nextUrl.pathname === '/auth/verified' && request.nextUrl.searchParams.get('success') === 'true';

        if (!isVerifiedSuccessPage && (isPublicAuthPage || request.nextUrl.pathname === '/')) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
