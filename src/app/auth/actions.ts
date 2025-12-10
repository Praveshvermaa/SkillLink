'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/utils/validators'

export async function login(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const validatedFields = loginSchema.safeParse({ email, password })

    if (!validatedFields.success) {
        return { success: false, error: validatedFields.error.issues[0].message }
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('Login error:', error)
        if (error.message.includes('Email not confirmed')) {
            return { success: false, error: 'Email not confirmed', code: 'email_not_confirmed', email }
        }
        return { success: false, error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const address = formData.get('address') as string
    const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null
    const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null
    const role = formData.get('role') as string // 'user' or 'provider'
    const headersList = await headers()
    const origin = headersList.get('origin')

    // Check if user already exists in profiles
    const { data: existingUser } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single()

    if (existingUser) {
        return { error: 'Email already exists' }
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
                phone,
                role,
                address,
                latitude,
                longitude,
            },
            emailRedirectTo: `${origin}/auth/callback?type=signup`,
        },
    })

    if (error) {
        console.error('Signup error:', error)
        return { error: error.message }
    }

    if (data.user) {
        // Check if user is already confirmed (e.g. if email confirmation is disabled)
        if (data.user.identities && data.user.identities.length > 0) {
            const identity = data.user.identities[0];
            if (identity.identity_data?.email_verified) {
                revalidatePath('/', 'layout')
                redirect('/dashboard')
            }
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: data.user.id,
                name,
                email,
                phone,
                role,
                address,
                latitude,
                longitude,
            })

        if (profileError) {
            console.error('Profile creation failed:', profileError)
            // If profile creation fails, we might still want to show success for signup
            // but log it. Or return error.
        }
    }

    return { success: true }
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    return { success: true }
}

export async function forgotPassword(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const headersList = await headers()
    const origin = headersList.get('origin')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?type=recovery`,
    })

    if (error) {
        console.error('Forgot password error:', error)
        return { error: error.message }
    }

    return { success: 'Check your email for the password reset link.' }
}

export async function updatePassword(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match' }
    }

    const { error } = await supabase.auth.updateUser({
        password,
    })

    if (error) {
        console.error('Update password error:', error)
        return { error: error.message }
    }

    redirect('/dashboard')
}

export async function resendVerification(email: string): Promise<{ error: string; success?: undefined } | { success: string; error?: undefined }> {
    const supabase = await createClient()
    const headersList = await headers()
    const origin = headersList.get('origin')

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
            emailRedirectTo: `${origin}/auth/callback?type=signup`,
        }
    })

    if (error) {
        return { error: error.message }
    }

    return { success: 'Verification email sent.' }
}
