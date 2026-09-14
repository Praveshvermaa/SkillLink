'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
  MessageSquare,
  Search,
  ArrowUpRight,
  User,
  SlidersHorizontal,
  X,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'

type Profile = {
  id: string
  name: string | null
  avatar_url: string | null
  role?: string | null
}

type ChatItem = {
  id: string
  created_at: string
  last_message_text?: string | null
  user_id: string
  provider_id: string
  provider: Profile | null
  user: Profile | null
  unread_count?: number
}

type ChatListClientProps = {
  initialChats: ChatItem[]
  currentUserId: string
}

export default function ChatListClient({ initialChats, currentUserId }: ChatListClientProps) {
  const [chats] = useState<ChatItem[]>(initialChats)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all')

  const totalUnread = useMemo(() => {
    return chats.reduce((acc, c) => acc + (c.unread_count || 0), 0)
  }, [chats])

  const filteredChats = useMemo(() => {
    return chats.filter(chat => {
      const isProvider = chat.provider_id === currentUserId
      const other = isProvider ? chat.user : chat.provider

      if (filterType === 'unread' && (!chat.unread_count || chat.unread_count <= 0)) {
        return false
      }

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const nameMatch = other?.name?.toLowerCase().includes(query)
        const lastMsgMatch = chat.last_message_text?.toLowerCase().includes(query)
        if (!nameMatch && !lastMsgMatch) return false
      }

      return true
    })
  }, [chats, currentUserId, filterType, searchQuery])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20 pb-20">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">

        {/* ── 1. Modern Header & Command Hub ── */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 via-card/50 to-muted/30 p-6 sm:p-8 shadow-sm backdrop-blur-xl">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  Direct Messages
                </h1>
                <Badge variant="outline" className="text-xs font-semibold px-3 py-1 rounded-full border-primary/30 bg-primary/5 text-primary">
                  {chats.length} {chats.length === 1 ? 'Conversation' : 'Conversations'}
                </Badge>
                {totalUnread > 0 && (
                  <Badge className="bg-rose-500 hover:bg-rose-600 text-white text-xs px-2.5 py-0.5 rounded-full">
                    {totalUnread} Unread
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
                Chat in real-time with your service providers and clients, negotiate terms, and coordinate bookings.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto self-stretch sm:self-auto">
              <Link href="/bookings" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full rounded-xl border-border/80 h-11 px-4 gap-2">
                  My Bookings
                </Button>
              </Link>
              <Link href="/skills" className="w-full sm:w-auto">
                <Button className="w-full rounded-xl shadow-md h-11 px-5 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                  <Compass className="h-4 w-4" />
                  Find a Pro
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── 2. Search & Filter Bar ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('all')}
              className="rounded-xl text-xs h-9 px-4 font-medium"
            >
              All ({chats.length})
            </Button>
            <Button
              variant={filterType === 'unread' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('unread')}
              className="rounded-xl text-xs h-9 px-4 font-medium"
            >
              Unread ({totalUnread})
            </Button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search people or messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-8 rounded-xl text-xs bg-muted/30 border-border/60 focus-visible:ring-1"
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

        {/* ── 3. Conversation Cards ── */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {filteredChats.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16 px-4 rounded-3xl border border-border/60 bg-card/50 backdrop-blur-md space-y-4"
              >
                <div className="h-16 w-16 rounded-2xl bg-muted/60 border border-border/60 flex items-center justify-center mx-auto text-muted-foreground">
                  <MessageSquare className="h-7 w-7 opacity-60" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">No conversations found</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                    {searchQuery
                      ? `No conversations match "${searchQuery}". Try a different name.`
                      : filterType === 'unread'
                      ? 'You are all caught up! No unread messages.'
                      : 'Connect with a pro from the skills catalog to start chatting.'}
                  </p>
                </div>
                {(searchQuery || filterType !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilterType('all')
                      setSearchQuery('')
                    }}
                    className="rounded-xl text-xs h-9"
                  >
                    Clear Filters
                  </Button>
                )}
              </motion.div>
            ) : (
              filteredChats.map((chat) => {
                const isProvider = chat.provider_id === currentUserId
                const other = isProvider ? chat.user : chat.provider
                const unread = chat.unread_count || 0

                return (
                  <motion.div
                    key={chat.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link href={`/chat/${chat.id}`} className="group block">
                      <Card className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
                        <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                          
                          {/* Avatar with status indicator */}
                          <div className="relative shrink-0">
                            <Avatar className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl border border-border/60 shadow-sm">
                              <AvatarImage src={other?.avatar_url || ''} className="object-cover" />
                              <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-sm sm:text-base">
                                {other?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                          </div>

                          {/* Chat Information */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 truncate">
                                <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
                                  {other?.name || 'Unknown User'}
                                </h3>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-semibold px-2 py-0 h-4 rounded-md uppercase"
                                >
                                  {isProvider ? 'Client' : 'Provider'}
                                </Badge>
                              </div>

                              <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                                {chat.created_at
                                  ? formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })
                                  : ''}
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm text-muted-foreground truncate leading-relaxed">
                              {chat.last_message_text || 'Tap to open the conversation'}
                            </p>
                          </div>

                          {/* Right Indicator or Unread Badge */}
                          <div className="flex items-center gap-3 shrink-0">
                            {unread > 0 && (
                              <Badge className="bg-primary text-primary-foreground text-xs h-5 px-2 rounded-full font-bold shadow-sm">
                                {unread}
                              </Badge>
                            )}
                            <div className="h-8 w-8 rounded-xl bg-muted/40 group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                            </div>
                          </div>

                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
