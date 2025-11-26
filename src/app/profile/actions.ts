'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const bio = formData.get('bio') as string
    const address = formData.get('address') as string

    // Handle avatar upload if present
    const avatarFile = formData.get('avatar') as File
    let avatar_url = null

    if (avatarFile && avatarFile.size > 0) {
        // Ensure bucket exists or handle error
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(`${user.id}/${Date.now()}-${avatarFile.name}`, avatarFile)

        if (!error && data) {
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path)
            avatar_url = publicUrl
        } else if (error) {
            console.error('Avatar upload error:', error)
        }
    }

    const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null
    const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null

    const updates: any = {
        name,
        phone,
        bio,
        address,
        latitude,
        longitude,
        // updated_at: new Date().toISOString(), // Supabase handles this if configured, or we add it
    }

    if (avatar_url) {
        updates.avatar_url = avatar_url
    }

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

    if (error) {
        console.error('Profile update error:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/profile/edit')

    // Return success before redirect (redirect throws, so this helps TypeScript)
    return { success: true }
}
