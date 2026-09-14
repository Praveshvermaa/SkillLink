'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createOrGetChat(otherUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Determine who is the user and who is the provider
    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const { data: otherProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', otherUserId)
        .single()

    if (!otherProfile) {
        throw new Error('User not found')
    }

    let userId: string
    let providerId: string

    if (currentProfile?.role === 'provider') {
        providerId = user.id
        userId = otherUserId
    } else {
        userId = user.id
        providerId = otherUserId
    }

    // Check if chat already exists
    const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('user_id', userId)
        .eq('provider_id', providerId)
        .single()

    if (existingChat) {
        redirect(`/chat/${existingChat.id}`)
    }

    // Create new chat
    const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
            user_id: userId,
            provider_id: providerId
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating chat:', error)
        throw new Error(`Failed to create chat: ${error.message}`)
    }

    revalidatePath('/chat')
    redirect(`/chat/${newChat.id}`)
}

export async function sendMessage(chatId: string, message: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    const { error } = await supabase
        .from('messages')
        .insert({
            chat_id: chatId,
            sender_id: user.id,
            message: message.trim()
        })

    if (error) {
        console.error('Error sending message:', error)
        throw new Error('Failed to send message')
    }

    revalidatePath(`/chat/${chatId}`)
}

export async function markChatMessagesAsRead(chatId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('chat_id', chatId)
        .neq('sender_id', user.id)
        .eq('read', false)

    if (error) {
        console.error('Error marking messages as read:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/chat')
    revalidatePath('/dashboard')
    revalidatePath(`/chat/${chatId}`)
    return { success: true }
}
