'use client'

import { useState } from 'react'
import { createOrGetChat } from '@/app/chat/actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { MessageCircle } from 'lucide-react'

export default function MessageProviderButton({ providerId }: { providerId?: string }) {
    const [isLoading, setIsLoading] = useState(false)

    const handleClick = async () => {
        if (!providerId) {
            toast.error('Provider information not available')
            return
        }

        setIsLoading(true)
        try {
            await createOrGetChat(providerId)
        } catch (error: any) {
            console.error('Error creating chat:', error)
            toast.error(error.message || 'Failed to create chat')
        } finally {
            setIsLoading(false)
        }
    }

    if (!providerId) {
        return null
    }

    return (
        <form action={handleClick}>
            <Button variant="outline" size="sm" type="submit" disabled={isLoading}>
                <MessageCircle className="h-4 w-4 mr-2" />
                {isLoading ? 'Loading...' : 'Message'}
            </Button>
        </form>
    )
}
