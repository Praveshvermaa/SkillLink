'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Phone } from 'lucide-react'

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
    partnerPhone
}: {
    chatId: string
    initialMessages: any[]
    userId: string
    partnerName?: string
    partnerPhone?: string
}) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const supabaseRef = useRef(createClient())
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const channelRef = useRef<any>(null)

    useEffect(() => {
        const supabase = supabaseRef.current

        console.log('🔌 Setting up Realtime subscription for chat:', chatId)
        console.log('👤 Current user ID:', userId)

        // Create a unique channel for this chat
        const channel = supabase
            .channel(`chat-${chatId}`, {
                config: {
                    broadcast: { self: true }
                }
            })
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${chatId}`
                },
                (payload) => {
                    console.log('📨 New message received:', payload)
                    console.log('📨 Message sender:', payload.new.sender_id)
                    console.log('📨 Current user:', userId)
                    setMessages((prev) => {
                        // Avoid duplicates
                        const exists = prev.some(msg => msg.id === payload.new.id)
                        if (exists) {
                            console.log('⚠️ Duplicate message detected, skipping')
                            return prev
                        }
                        console.log('✅ Adding new message to state')
                        return [...prev, payload.new as Message]
                    })
                }
            )
            .subscribe((status) => {
                console.log('🔔 Subscription status:', status)
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Successfully subscribed to chat:', chatId)
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Channel error - check Realtime settings')
                } else if (status === 'TIMED_OUT') {
                    console.error('⏱️ Subscription timed out')
                }
            })

        channelRef.current = channel

        return () => {
            console.log('🔌 Cleaning up channel for chat:', chatId)
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

        const { error } = await supabaseRef.current
            .from('messages')
            .insert({
                chat_id: chatId,
                sender_id: userId,
                message: messageText
            })

        if (error) {
            console.error('Error sending message:', error)
            setNewMessage(messageText) // Restore message on error
        }

        setIsLoading(false)
        inputRef.current?.focus()
    }

    const handlePhoneCall = () => {
        if (partnerPhone) {
            // Clean the phone number (remove spaces, dashes, etc.)
            const cleanPhone = partnerPhone.replace(/[^0-9+]/g, '')
            // Open phone dialer
            window.location.href = `tel:${cleanPhone}`
        } else {
            alert('Phone number not available for this user')
        }
    }

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        } else if (diffInHours < 48) {
            return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
                date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        }
    }

    const groupMessagesByDate = (messages: Message[]) => {
        const groups: { [key: string]: Message[] } = {}

        messages.forEach(msg => {
            // Use ISO date string (YYYY-MM-DD) as key to avoid locale parsing issues
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
        <div className="flex flex-col h-full border-none rounded-2xl shadow-xl bg-background/80 backdrop-blur-sm overflow-hidden ring-1 ring-border/50">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                        {partnerName?.[0] || 'U'}
                    </div>
                    <div>
                        <h2 className="font-semibold text-lg leading-none">{partnerName || 'Chat'}</h2>
                            <p className="text-xs text-muted-foreground font-medium">Chat</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {partnerPhone && (
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={handlePhoneCall}
                            title={`Call ${partnerPhone}`}
                            className="rounded-full shadow-sm hover:shadow-md transition-all"
                        >
                            <Phone className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-background/50 scroll-smooth">
                {Object.entries(messageGroups).map(([date, msgs]) => (
                    <div key={date} className="space-y-6">
                        {/* Date Separator */}
                        <div className="flex items-center justify-center sticky top-0 z-0">
                            <div className="bg-muted/80 backdrop-blur-sm text-muted-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm border border-border/50">
                                {(() => {
                                    const [year, month, day] = date.split('-').map(Number);
                                    const d = new Date(year, month - 1, day);
                                    const today = new Date();
                                    const yesterday = new Date();
                                    yesterday.setDate(yesterday.getDate() - 1);

                                    if (d.toDateString() === today.toDateString()) return 'Today';
                                    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
                                    return d.toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric'
                                    });
                                })()}
                            </div>
                        </div>

                        {/* Messages for this date */}
                        <div className="space-y-2">
                            {msgs.map((msg, index) => {
                                const isOwn = msg.sender_id === userId
                                const showAvatar = index === 0 || msgs[index - 1].sender_id !== msg.sender_id

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 duration-300`}
                                    >
                                        <div className={`flex items-end gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {/* Avatar */}
                                            {showAvatar ? (
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${isOwn ? 'bg-primary' : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                    {isOwn ? 'Y' : (partnerName?.[0] || 'U')}
                                                </div>
                                            ) : (
                                                <div className="w-8" />
                                            )}

                                            {/* Message Bubble */}
                                            <div className="flex flex-col gap-1">
                                                <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${isOwn
                                                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                    : 'bg-muted/50 border border-border/50 text-foreground rounded-bl-sm'
                                                    }`}>
                                                    <p className="break-words whitespace-pre-wrap">{msg.message}</p>
                                                </div>
                                                <span className={`text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'text-right pr-1' : 'text-left pl-1'
                                                    }`}>
                                                    {formatTime(msg.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-4 bg-background border-t">
                <div className="flex gap-3 items-center bg-muted/30 p-1.5 rounded-full border border-input focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-all shadow-sm">
                    <Input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 px-4 py-2 h-auto placeholder:text-muted-foreground/70"
                        disabled={isLoading}
                        autoComplete="off"
                    />
                    <Button
                        type="submit"
                        disabled={!newMessage.trim() || isLoading}
                        size="icon"
                        className="h-9 w-9 rounded-full shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </div>
    )
}
