import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ChatListClient from '@/components/chat/ChatListClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ChatListPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect('/auth/login');

    const { data: chats, error } = await supabase
        .from('chats')
        .select(
            `
      *,
      provider:profiles!chats_provider_id_fkey(id, name, avatar_url),
      user:profiles!chats_user_id_fkey(id, name, avatar_url)
    `
        )
        .or(`user_id.eq.${user.id},provider_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching chats:', error);
        return (
            <div className="container py-10 text-center">
                <h2 className="text-2xl font-semibold text-red-500">Error loading chats</h2>
                <p className="text-muted-foreground mt-2">{error.message}</p>
            </div>
        );
    }

    // Fetch unread count for user's chats
    const chatIds = (chats || []).map((c: any) => c.id);
    let unreadMap: { [chatId: string]: number } = {};

    if (chatIds.length > 0) {
        const { data: unreadData } = await supabase
            .from('messages')
            .select('chat_id')
            .in('chat_id', chatIds)
            .neq('sender_id', user.id)
            .eq('read', false);

        if (unreadData) {
            unreadData.forEach((m: any) => {
                unreadMap[m.chat_id] = (unreadMap[m.chat_id] || 0) + 1;
            });
        }
    }

    const safeChats = (chats || []).map((c: any) => ({
        id: c.id,
        created_at: c.created_at,
        last_message_text: c.last_message_text,
        user_id: c.user_id,
        provider_id: c.provider_id,
        provider: c.provider,
        user: c.user,
        unread_count: unreadMap[c.id] || 0,
    }));

    return <ChatListClient initialChats={safeChats} currentUserId={user.id} />;
}
