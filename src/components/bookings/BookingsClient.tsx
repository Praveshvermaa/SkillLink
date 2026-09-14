'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  MessageSquare,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  ArrowRight,
  Filter,
  User,
  SlidersHorizontal,
  Mail,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  Check,
  X,
  Loader2,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { updateBookingStatus } from '@/app/bookings/actions'
import { createOrGetChat } from '@/app/chat/actions'
import { toast } from 'sonner'
import { ReviewDialog } from '@/components/reviews/ReviewDialog'

type Profile = {
  id: string
  name?: string | null
  email?: string | null
  phone?: string | null
  avatar_url?: string | null
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

  // Scope filter: 'all' | 'requests' (received as provider) | 'my' (placed as client)
  const [scopeFilter, setScopeFilter] = useState<'all' | 'requests' | 'my'>('all')
  // Status filter: 'all' | 'pending' | 'approved' | 'completed' | 'rejected'
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const isProviderBooking = (booking: Booking) => booking.provider?.id === currentUserId

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    setLoading(bookingId)
    try {
      await updateBookingStatus(bookingId, newStatus)
      setBookings(prev =>
        prev.map(b =>
          b.id === bookingId ? { ...b, status: newStatus } : b
        )
      )
      toast.success(`Booking marked as ${newStatus}`)
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
    } catch (error: any) {
      if (error?.digest?.startsWith('NEXT_REDIRECT')) {
        throw error
      }
      toast.error('Failed to open chat')
      console.error(error)
    } finally {
      setMessagingLoading(null)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return {
          label: 'Pending',
          icon: Clock,
          color: 'text-amber-500 dark:text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300',
          indicator: 'bg-amber-500 animate-pulse',
        }
      case 'approved':
        return {
          label: 'Approved',
          icon: CheckCircle2,
          color: 'text-indigo-500 dark:text-indigo-400',
          bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300',
          indicator: 'bg-indigo-500',
        }
      case 'completed':
        return {
          label: 'Completed',
          icon: CheckCircle2,
          color: 'text-emerald-500 dark:text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
          indicator: 'bg-emerald-500',
        }
      case 'rejected':
        return {
          label: 'Cancelled / Rejected',
          icon: XCircle,
          color: 'text-rose-500 dark:text-rose-400',
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300',
          indicator: 'bg-rose-500',
        }
      default:
        return {
          label: status,
          icon: AlertCircle,
          color: 'text-muted-foreground',
          bg: 'bg-muted border-border text-muted-foreground',
          indicator: 'bg-muted-foreground',
        }
    }
  }

  // Counts calculated across all bookings
  const counts = useMemo(() => {
    const res = {
      total: bookings.length,
      incoming: bookings.filter(b => isProviderBooking(b)).length,
      outgoing: bookings.filter(b => !isProviderBooking(b)).length,
      pending: bookings.filter(b => b.status?.toLowerCase() === 'pending').length,
      approved: bookings.filter(b => b.status?.toLowerCase() === 'approved').length,
      completed: bookings.filter(b => b.status?.toLowerCase() === 'completed').length,
      rejected: bookings.filter(b => b.status?.toLowerCase() === 'rejected').length,
    }
    return res
  }, [bookings])

  // Filtered bookings list
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const isProv = isProviderBooking(booking)

      // Scope match
      if (scopeFilter === 'requests' && !isProv) return false
      if (scopeFilter === 'my' && isProv) return false

      // Status match
      if (statusFilter !== 'all' && booking.status?.toLowerCase() !== statusFilter.toLowerCase()) {
        return false
      }

      // Search match (title, counterpart name, address)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const counterparty = isProv ? booking.customer : booking.provider
        const titleMatch = booking.skill?.title?.toLowerCase().includes(query)
        const nameMatch = counterparty?.name?.toLowerCase().includes(query)
        const addressMatch = booking.skill?.address?.toLowerCase().includes(query)
        if (!titleMatch && !nameMatch && !addressMatch) return false
      }

      return true
    })
  }, [bookings, scopeFilter, statusFilter, searchQuery])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20 pb-20">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">

        {/* ── 1. Modern Command Center Header ── */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 via-card/50 to-muted/30 p-6 sm:p-8 shadow-sm backdrop-blur-xl">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  Bookings Hub
                </h1>
                <Badge variant="outline" className="text-xs font-semibold px-3 py-1 rounded-full border-primary/30 bg-primary/5 text-primary">
                  {bookings.length} Total Records
                </Badge>
                {counts.pending > 0 && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-2.5 py-0.5 rounded-full">
                    {counts.pending} Action Needed
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
                Track, respond to, and complete your appointments and service engagements with ease.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto self-stretch sm:self-auto">
              <Link href="/skills" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full rounded-xl border-border/80 h-11 px-4 gap-2">
                  <Compass className="h-4 w-4 text-muted-foreground" />
                  Explore Services
                </Button>
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button className="w-full rounded-xl shadow-md h-11 px-5 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                  Dashboard
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── 2. Top Summary Metrics ── */}
        <div className="grid gap-4 sm:gap-5 grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Bookings</p>
                <p className="text-2xl sm:text-3xl font-bold">{counts.total}</p>
                <p className="text-[11px] text-muted-foreground">Across all categories</p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
                <CalendarIcon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending Action</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-500">{counts.pending}</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400">Awaiting confirmation</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Approved</p>
                <p className="text-2xl sm:text-3xl font-bold text-indigo-500">{counts.approved}</p>
                <p className="text-[11px] text-muted-foreground">Scheduled sessions</p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Completed</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-500">{counts.completed}</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Successfully closed</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── 3. Controls & Filter Bar ── */}
        <div className="flex flex-col gap-4 p-4 sm:p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm">
          
          {/* Scope selection: All / Incoming Requests / My Bookings */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
              <Button
                variant={scopeFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setScopeFilter('all')}
                className="rounded-xl text-xs h-9 px-4 font-medium shrink-0"
              >
                All Bookings ({counts.total})
              </Button>
              <Button
                variant={scopeFilter === 'requests' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setScopeFilter('requests')}
                className="rounded-xl text-xs h-9 px-4 font-medium shrink-0"
              >
                Incoming Requests ({counts.incoming})
              </Button>
              <Button
                variant={scopeFilter === 'my' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setScopeFilter('my')}
                className="rounded-xl text-xs h-9 px-4 font-medium shrink-0"
              >
                My Bookings ({counts.outgoing})
              </Button>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by skill, client, or place..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-3 rounded-xl text-xs bg-muted/30 border-border/60 focus-visible:ring-1"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Status Tab Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-border/40">
            {[
              { id: 'all', label: 'All Statuses', count: counts.total },
              { id: 'pending', label: 'Pending', count: counts.pending },
              { id: 'approved', label: 'Approved', count: counts.approved },
              { id: 'completed', label: 'Completed', count: counts.completed },
              { id: 'rejected', label: 'Cancelled', count: counts.rejected },
            ].map((tab) => {
              const active = statusFilter === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

        </div>

        {/* ── 4. Bookings Cards Grid ── */}
        <AnimatePresence mode="wait">
          {filteredBookings.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16 px-4 rounded-3xl border border-border/60 bg-card/50 backdrop-blur-md space-y-4"
            >
              <div className="h-16 w-16 rounded-2xl bg-muted/60 border border-border/60 flex items-center justify-center mx-auto text-muted-foreground">
                <SlidersHorizontal className="h-7 w-7 opacity-60" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold">No bookings match your filters</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  {searchQuery || statusFilter !== 'all' || scopeFilter !== 'all'
                    ? 'Try relaxing your filter parameters or search terms to see more records.'
                    : 'Your bookings and incoming requests will appear here once booked.'}
                </p>
              </div>
              {(searchQuery || statusFilter !== 'all' || scopeFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setScopeFilter('all')
                    setStatusFilter('all')
                    setSearchQuery('')
                  }}
                  className="rounded-xl text-xs h-9"
                >
                  Reset All Filters
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredBookings.map((booking) => {
                const isProv = isProviderBooking(booking)
                const counterparty = isProv ? booking.customer : booking.provider
                const statusConfig = getStatusConfig(booking.status)
                const StatusIcon = statusConfig.icon
                const isActionBusy = loading === booking.id

                return (
                  <motion.div
                    key={booking.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 overflow-hidden flex flex-col h-full">
                      
                      {/* Card Header: Role indicator & Status Badge */}
                      <CardHeader className="p-5 pb-3 border-b border-border/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              isProv
                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                                : 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20'
                            }`}
                          >
                            {isProv ? 'Incoming Request' : 'Your Booking'}
                          </Badge>

                          <Badge
                            variant="outline"
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusConfig.bg}`}
                          >
                            <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${statusConfig.indicator}`} />
                            {statusConfig.label}
                          </Badge>
                        </div>

                        {/* Title & Price */}
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base font-bold line-clamp-1">
                            {booking.skill?.title || 'Service Session'}
                          </CardTitle>
                          {booking.price !== null && (
                            <span className="text-base font-extrabold text-foreground shrink-0">
                              ₹{booking.price}
                            </span>
                          )}
                        </div>
                      </CardHeader>

                      {/* Card Body: Counterparty, Date, Address */}
                      <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          {/* Counterparty info */}
                          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-muted/40 border border-border/40">
                            <Avatar className="h-10 w-10 rounded-xl border border-border/60 shrink-0">
                              <AvatarImage src={counterparty?.avatar_url || undefined} className="object-cover" />
                              <AvatarFallback className="rounded-xl text-xs font-bold bg-primary/10 text-primary">
                                {counterparty?.name?.[0]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                {isProv ? 'Customer' : 'Provider'}
                              </p>
                              <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                {counterparty?.name || 'Unknown User'}
                              </p>
                            </div>
                          </div>

                          {/* Date and Location */}
                          <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="font-medium text-foreground/80">
                                {format(new Date(booking.date), 'EEEE, MMMM d, yyyy')}
                              </span>
                            </div>

                            {booking.skill?.address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate">{booking.skill.address}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons footer */}
                        <div className="space-y-2 pt-3 border-t border-border/40">
                          
                          {/* Primary status transitions */}
                          {booking.status === 'pending' && isProv && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(booking.id, 'approved')}
                                disabled={isActionBusy}
                                className="flex-1 rounded-xl text-xs font-semibold h-9 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                              >
                                {isActionBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                                disabled={isActionBusy}
                                className="flex-1 rounded-xl text-xs font-semibold h-9 border-rose-500/30 text-rose-600 hover:bg-rose-500/10 gap-1.5"
                              >
                                {isActionBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                                Decline
                              </Button>
                            </div>
                          )}

                          {booking.status === 'pending' && !isProv && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                              disabled={isActionBusy}
                              className="w-full rounded-xl text-xs font-semibold h-9 border-rose-500/30 text-rose-600 hover:bg-rose-500/10 gap-1.5"
                            >
                              {isActionBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                              Cancel Booking
                            </Button>
                          )}

                          {booking.status === 'approved' && isProv && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(booking.id, 'completed')}
                              disabled={isActionBusy}
                              className="w-full rounded-xl text-xs font-semibold h-9 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                            >
                              {isActionBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              Mark as Completed
                            </Button>
                          )}

                          {booking.status === 'completed' && !isProv && (
                            <div className="w-full">
                              <ReviewDialog
                                bookingId={booking.id}
                                trigger={
                                  <Button variant="outline" size="sm" className="w-full rounded-xl text-xs font-semibold h-9 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10">
                                    Leave Review & Rating
                                  </Button>
                                }
                              />
                            </div>
                          )}

                          {/* Secondary Communication Actions (Message & Call) */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMessage(counterparty?.id || '')}
                              disabled={messagingLoading === counterparty?.id || !counterparty?.id}
                              className="flex-1 rounded-xl text-xs h-8 hover:bg-muted/70 gap-1.5 border border-border/40"
                            >
                              {messagingLoading === counterparty?.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              Chat
                            </Button>

                            {counterparty?.phone && (
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                className="flex-1 rounded-xl text-xs h-8 hover:bg-muted/70 gap-1.5 border border-border/40"
                              >
                                <a href={`tel:${counterparty.phone}`}>
                                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                  Call
                                </a>
                              </Button>
                            )}

                            {counterparty?.email && (
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                className="px-2.5 rounded-xl text-xs h-8 hover:bg-muted/70 border border-border/40"
                                title={counterparty.email}
                              >
                                <a href={`mailto:${counterparty.email}`}>
                                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                </a>
                              </Button>
                            )}
                          </div>

                        </div>
                      </CardContent>

                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
