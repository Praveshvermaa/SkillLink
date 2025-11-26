'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createSkill(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const title = formData.get('title') as string
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const experience = formData.get('experience') as string
    const address = formData.get('address') as string
    const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null
    const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null

    const { error } = await supabase
        .from('skills')
        .insert({
            provider_id: user.id,
            title,
            category,
            description,
            price,
            experience,
            address,
            latitude,
            longitude,
        })

    if (error) {
        console.error('Create skill error:', error)
        return { error: error.message }
    }

    revalidatePath('/skills')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function deleteSkill(skillId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // First, verify that the user owns this skill
    const { data: skill, error: fetchError } = await supabase
        .from('skills')
        .select('provider_id')
        .eq('id', skillId)
        .single()

    if (fetchError) {
        console.error('Fetch skill error:', fetchError)
        return { error: 'Skill not found' }
    }

    if (skill.provider_id !== user.id) {
        return { error: 'Not authorized to delete this skill' }
    }

    // Delete the skill
    const { error: deleteError } = await supabase
        .from('skills')
        .delete()
        .eq('id', skillId)

    if (deleteError) {
        console.error('Delete skill error:', deleteError)
        return { error: deleteError.message }
    }

    revalidatePath('/skills')
    revalidatePath('/provider/skills')
    revalidatePath('/dashboard')

    return { success: true }
}
