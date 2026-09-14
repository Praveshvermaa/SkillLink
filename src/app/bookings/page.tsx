import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookingsClient from '@/components/bookings/BookingsClient'

export default async function BookingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
            *,
            skill:skills(title, price, address),
            provider:profiles!bookings_provider_id_fkey(id, name, email, phone, avatar_url),
            customer:profiles!bookings_user_id_fkey(id, name, email, phone, avatar_url)
        `)
        .or(`user_id.eq.${user.id},provider_id.eq.${user.id}`)
        .order('date', { ascending: true })

    if (error) {
        console.error('Error fetching bookings:', error)
        return (
            <div className="container py-8 text-center">
                <h1 className="text-2xl font-bold text-red-500">Error loading bookings</h1>
                <p className="text-muted-foreground">{error.message}</p>
            </div>
        )
    }

    const safeBookings = (bookings || []).map((b: any) => ({
        id: b.id,
        date: b.date,
        status: b.status,
        skill: b.skill || null,
        provider: b.provider || null,
        customer: b.customer || null,
        price: b.skill?.price ?? null,
    }))

    return <BookingsClient initialBookings={safeBookings} currentUserId={user.id} />
}
