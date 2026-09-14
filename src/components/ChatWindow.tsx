'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Send,
  Phone,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  Check,
  CheckCheck,
  Sparkles,
  Loader2,
} from 'lucide-react'

import { markChatMessagesAsRead } from '@/app/chat/actions'

interface Message {
  id: string
  chat_id: string
  sender_id: string
  message: string
  created_at: string
  read: boolean
}

export default function ChatWindow({
  chatId,
  initialMessages,
  userId,
  partnerName,
  partnerPhone,
  partnerAvatar,
  partnerRole,
}: {
  chatId: string
  initialMessages: any[]
  userId: string
  partnerName?: string
  partnerPhone?: string
  partnerAvatar?: string | null
  partnerRole?: string
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabaseRef = useRef(createClient())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Mark messages as read on mount via server action and direct client update
    const doMarkRead = async () => {
      // 1. Server action
      const res = await markChatMessagesAsRead(chatId)
      if (!res.success) {
        console.warn('Server markChatMessagesAsRead result:', res)
      }

      // 2. Direct client fallback in case of session/RLS differences
      const { error: clientUpdateError } = await supabaseRef.current
        .from('messages')
        .update({ read: true })
        .eq('chat_id', chatId)
        .neq('sender_id', userId)
        .eq('read', false)

      if (clientUpdateError) {
        console.error('Supabase RLS error updating read status on messages:', clientUpdateError)
      }
    }

    doMarkRead()

    const supabase = supabaseRef.current

    // Realtime channel
    const channel = supabase
      .channel(`chat-${chatId}`, {
        config: { broadcast: { self: true } },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === newMsg.id)
            if (exists) return prev
            return [...prev, newMsg]
          })

          // If message is from partner and we are currently viewing this chat, mark as read
          if (newMsg.sender_id !== userId) {
            doMarkRead()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId, userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isLoading) return

    setIsLoading(true)
    const messageText = newMessage.trim()
    setNewMessage('')

    const { error } = await supabaseRef.current.from('messages').insert({
      chat_id: chatId,
      sender_id: userId,
      message: messageText,
    })

    if (error) {
      console.error('Error sending message:', error)
      setNewMessage(messageText)
    }

    setIsLoading(false)
    inputRef.current?.focus()
  }

  const handlePhoneCall = () => {
    if (partnerPhone) {
      const cleanPhone = partnerPhone.replace(/[^0-9+]/g, '')
      window.location.href = `tel:${cleanPhone}`
    } else {
      alert('Phone number is not available for this user')
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {}
    msgs.forEach((msg) => {
      const d = new Date(msg.created_at)
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(msg)
    })
    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-full rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
      
      {/* ── Chat Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 bg-card/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3.5">
          <Link href="/chat">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted/80">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="relative">
            <Avatar className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl border border-border/60 shadow-sm">
              <AvatarImage src={partnerAvatar || undefined} className="object-cover" />
              <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-sm">
                {partnerName?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base text-foreground leading-tight">
                {partnerName || 'Chat Participant'}
              </h2>
              {partnerRole && (
                <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0 h-4 rounded-md">
                  {partnerRole}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active on SkillLink
            </p>
          </div>
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center gap-2">
          <Link href="/bookings">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs h-9 px-3 gap-1.5 border-border/60 hidden sm:flex"
            >
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Bookings
            </Button>
          </Link>

          {partnerPhone && (
            <Button
              variant="outline"
              size="icon"
              onClick={handlePhoneCall}
              title={`Call ${partnerPhone}`}
              className="rounded-xl h-9 w-9 border-border/60 hover:bg-muted/80"
            >
              <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Messages Feed Area ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gradient-to-b from-muted/10 via-background/40 to-background/60 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base">Direct Conversation</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              Say hello to {partnerName || 'your connection'}! Inquire about services, schedules, and quotes.
            </p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date} className="space-y-4">
              {/* Date Separator Pill */}
              <div className="flex items-center justify-center sticky top-0 z-0 py-1">
                <div className="bg-muted/90 backdrop-blur-md text-muted-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-border/50 shadow-xs">
                  {(() => {
                    const [year, month, day] = date.split('-').map(Number)
                    const d = new Date(year, month - 1, day)
                    const today = new Date()
                    const yesterday = new Date()
                    yesterday.setDate(yesterday.getDate() - 1)

                    if (d.toDateString() === today.toDateString()) return 'Today'
                    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
                    return d.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })
                  })()}
                </div>
              </div>

              {/* Message Bubbles */}
              <div className="space-y-2.5">
                {msgs.map((msg, index) => {
                  const isOwn = msg.sender_id === userId
                  const showAvatar = index === 0 || msgs[index - 1].sender_id !== msg.sender_id

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group animate-in fade-in duration-200`}
                    >
                      <div className={`flex items-end gap-2.5 max-w-[82%] sm:max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        
                        {/* Avatar */}
                        {showAvatar ? (
                          <Avatar className="h-7 w-7 rounded-xl border border-border/60 shrink-0 mb-1">
                            <AvatarImage src={isOwn ? undefined : (partnerAvatar || undefined)} />
                            <AvatarFallback className={`rounded-xl text-[10px] font-bold ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                              {isOwn ? 'Me' : (partnerName?.[0]?.toUpperCase() || 'U')}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-7 shrink-0" />
                        )}

                        {/* Bubble */}
                        <div className="flex flex-col gap-1">
                          <div
                            className={`px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm'
                                : 'bg-card/95 border border-border/60 text-foreground rounded-2xl rounded-bl-sm backdrop-blur-sm'
                            }`}
                          >
                            <p className="break-words whitespace-pre-wrap">{msg.message}</p>
                          </div>

                          <span
                            className={`text-[10px] text-muted-foreground flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity ${
                              isOwn ? 'justify-end pr-1' : 'justify-start pl-1'
                            }`}
                          >
                            {formatTime(msg.created_at)}
                            {isOwn && <CheckCheck className="h-3 w-3 text-primary" />}
                          </span>
                        </div>

                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ── */}
      <form onSubmit={sendMessage} className="p-3 sm:p-4 bg-card/90 border-t border-border/50 backdrop-blur-md">
        <div className="flex gap-2 sm:gap-3 items-center bg-muted/40 p-1.5 rounded-2xl border border-border/60 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all shadow-xs">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${partnerName || 'here'}...`}
            className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 px-3.5 py-2 h-auto text-xs sm:text-sm placeholder:text-muted-foreground/60"
            disabled={isLoading}
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isLoading}
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>

    </div>
  )
}
