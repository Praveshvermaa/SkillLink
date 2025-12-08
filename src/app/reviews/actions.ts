'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const reviewSchema = z.object({
    bookingId: z.string().uuid(),
    rating: z.number().min(1).max(5),
    comment: z.string().min(10, "Comment must be at least 10 characters long").max(500, "Comment must be less than 500 characters"),
})

export async function createReview(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'You must be logged in to leave a review' }
    }

    const bookingId = formData.get('bookingId') as string
    const rating = parseInt(formData.get('rating') as string)
    const comment = formData.get('comment') as string

    const validatedFields = reviewSchema.safeParse({
        bookingId,
        rating,
        comment,
    })

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors }
    }

    // Verify booking belongs to user and is completed
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, status, user_id')
        .eq('id', bookingId)
        .single()

    if (bookingError || !booking) {
        return { error: 'Booking not found' }
    }

    if (booking.user_id !== user.id) {
        return { error: 'You are not authorized to review this booking' }
    }

    if (booking.status !== 'completed') {
        return { error: 'You can only review completed bookings' }
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', bookingId)
        .single()

    if (existingReview) {
        return { error: 'You have already reviewed this booking' }
    }

    const { error } = await supabase
        .from('reviews')
        .insert({
            booking_id: bookingId,
            rating,
            comment,
        })

    if (error) {
        console.error('Error creating review:', error)
        return { error: 'Failed to submit review' }
    }

    revalidatePath('/bookings')
    revalidatePath(`/skills`) // Ideally we'd revalidate the specific skill page, but we don't have the ID here easily without another query. 
    // We can fetch skill_id from booking if needed to be more precise.

    return { success: true }
}

export async function getReviewsByProvider(providerId: string) {
    const supabase = await createClient()

    // We need to join reviews -> bookings -> skills (to get provider_id)
    // But our schema has provider_id on bookings too.

    const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
            id,
            rating,
            comment,
            created_at,
            booking:bookings!inner(
                provider_id,
                user:profiles!bookings_user_id_fkey(name, avatar_url)
            )
        `)
        .eq('booking.provider_id', providerId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching reviews:', error)
        return []
    }

    return reviews.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        user: r.booking.user
    }))
}
