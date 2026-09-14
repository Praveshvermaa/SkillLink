'use client'

import { useState } from 'react'
import { createOrGetChat } from '@/app/chat/actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { MessageSquare, Loader2 } from 'lucide-react'

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
      if (error?.digest?.startsWith('NEXT_REDIRECT')) {
        throw error
      }
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
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className="rounded-xl text-xs h-9 px-3 gap-1.5 border-border/60 hover:bg-muted/80 font-medium"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessageSquare className="h-4 w-4 text-primary" />
      )}
      Direct Message
    </Button>
  )
}
