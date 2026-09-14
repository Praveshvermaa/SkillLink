import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ChatWindow from '@/components/ChatWindow'

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Fetch chat details to verify access and get partner info
    const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select(`
            *,
            provider:profiles!chats_provider_id_fkey(id, name, phone, avatar_url),
            user:profiles!chats_user_id_fkey(id, name, phone, avatar_url)
        `)
        .eq('id', id)
        .single()

    if (chatError || !chat) {
        notFound()
    }

    // Verify participation
    if (chat.user_id !== user.id && chat.provider_id !== user.id) {
        redirect('/chat')
    }

    const isProvider = chat.provider_id === user.id
    const otherParty = isProvider ? chat.user : chat.provider

    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', id)
        .order('created_at', { ascending: true })

    if (messagesError) {
        console.error('Error fetching messages:', messagesError)
    }

    // Mark unread messages sent by the other party as read
    await supabase
        .from('messages')
        .update({ read: true })
        .eq('chat_id', id)
        .neq('sender_id', user.id)
        .eq('read', false)

    return (
        <div className="h-[calc(100vh-4rem)] p-4">
            <ChatWindow
                chatId={id}
                initialMessages={messages || []}
                userId={user.id}
                partnerName={otherParty?.name}
                partnerPhone={otherParty?.phone}
                partnerAvatar={otherParty?.avatar_url}
                partnerRole={isProvider ? 'Client' : 'Provider'}
            />
        </div>
    )
}
