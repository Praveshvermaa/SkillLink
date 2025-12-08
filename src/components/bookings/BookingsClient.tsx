'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, MessageSquare, Phone, DollarSign } from 'lucide-react'
import { updateBookingStatus } from '@/app/bookings/actions'
import { createOrGetChat } from '@/app/chat/actions'
import { toast } from 'sonner'
import { ReviewDialog } from '@/components/reviews/ReviewDialog'

type Profile = {
  id: string
  name?: string | null
  email?: string | null
  phone?: string | null
}

type Skill = {
  title: string
  price: number
  address?: string | null
}

type Booking = {
  id: string
  date: string
  status: string
  skill: Skill | null
  provider: Profile | null
  customer: Profile | null
  price: number | null
}

type BookingsClientProps = {
  initialBookings: Booking[]
  currentUserId: string
}

export default function BookingsClient({ initialBookings, currentUserId }: BookingsClientProps) {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [loading, setLoading] = useState<string | null>(null)
  const [messagingLoading, setMessagingLoading] = useState<string | null>(null)

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    setLoading(bookingId)
    try {
      await updateBookingStatus(bookingId, newStatus)
      setBookings(prev =>
        prev.map(b =>
          b.id === bookingId ? { ...b, status: newStatus } : b
        )
      )
      toast.success(`Booking ${newStatus}`)
    } catch (error) {
      toast.error('Failed to update booking status')
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  const handleMessage = async (userId: string) => {
    setMessagingLoading(userId)
    try {
      await createOrGetChat(userId)
      router.push('/chat')
    } catch (error) {
      toast.error('Failed to open chat')
      console.error(error)
    } finally {
      setMessagingLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'approved':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const isProvider = (booking: Booking) => booking.provider?.id === currentUserId

  // Separate bookings into incoming requests and your bookings
  const incomingRequests = bookings.filter(b => isProvider(b))
  const yourBookings = bookings.filter(b => !isProvider(b))

  if (bookings.length === 0) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-semibold">No bookings yet</h2>
          <p className="mt-2 text-muted-foreground">
            Your bookings will appear here once you make or receive one.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your bookings and appointments
        </p>
      </div>

      {/* Incoming Requests Section */}
      {incomingRequests.length > 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Incoming Requests</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Booking requests from customers for your services
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {incomingRequests.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {booking.skill?.title || 'Unknown Service'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Customer: {booking.customer?.name || 'Unknown'}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {new Date(booking.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {booking.skill?.address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{booking.skill.address}</span>
                      </div>
                    )}

                    {booking.price && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">₹{booking.price}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMessage(booking.customer?.id || '')}
                          disabled={messagingLoading === booking.customer?.id || !booking.customer?.id}
                          className="flex-1"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        {booking.customer?.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="flex-1"
                          >
                            <a href={`tel:${booking.customer.phone}`}>
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {booking.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(booking.id, 'approved')}
                        disabled={loading === booking.id}
                        className="flex-1"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                        disabled={loading === booking.id}
                        className="flex-1"
                      >
                        Decline
                      </Button>
                    </div>
                  )}

                  {booking.status === 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(booking.id, 'completed')}
                      disabled={loading === booking.id}
                      className="w-full"
                    >
                      Mark as Completed
                    </Button>
                  )}

                  {booking.status === 'completed' && !isProvider(booking) && (
                    <ReviewDialog bookingId={booking.id} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Your Bookings Section */}
      {yourBookings.length > 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Your Bookings</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Services you have booked from providers
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {yourBookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {booking.skill?.title || 'Unknown Service'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Provider: {booking.provider?.name || 'Unknown'}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {new Date(booking.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {booking.skill?.address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{booking.skill.address}</span>
                      </div>
                    )}

                    {booking.price && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">₹{booking.price}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMessage(booking.provider?.id || '')}
                          disabled={messagingLoading === booking.provider?.id || !booking.provider?.id}
                          className="flex-1"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        {booking.provider?.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="flex-1"
                          >
                            <a href={`tel:${booking.provider.phone}`}>
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {booking.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                      disabled={loading === booking.id}
                      className="w-full"
                    >
                      Cancel Booking
                    </Button>
                  )}

                  {booking.status === 'completed' && (
                    <ReviewDialog bookingId={booking.id} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State - when no bookings in either section */}
      {incomingRequests.length === 0 && yourBookings.length === 0 && (
        <div className="text-center py-12 rounded-xl border bg-muted/20">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No bookings yet</h2>
          <p className="mt-2 text-muted-foreground">
            Your bookings will appear here once you make or receive one.
          </p>
        </div>
      )}
    </div>
  )
}
