'use client'

import { useState, useTransition } from 'react'
import { createBooking } from '@/app/bookings/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, ShieldCheck, Loader2, Clock } from 'lucide-react'

export default function BookingForm({
  skillId,
  providerId,
  price,
}: {
  skillId: string
  providerId: string
  price: number
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      try {
        await createBooking(formData)
      } catch (e: any) {
        if (e.message === 'NEXT_REDIRECT') return
        setError(e.message)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <input type="hidden" name="skillId" value={skillId} />
      <input type="hidden" name="providerId" value={providerId} />

      <div className="space-y-2">
        <Label htmlFor="date" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          Preferred Date & Time
        </Label>
        <Input
          id="date"
          name="date"
          type="datetime-local"
          required
          className="rounded-xl h-10 text-xs sm:text-sm bg-muted/40 border-border/60"
        />
        <p className="text-[11px] text-muted-foreground">Select when you would like this service to begin.</p>
      </div>

      <div className="pt-4 border-t border-border/40 space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-muted-foreground font-medium">Service Fee</span>
          <span className="text-xl font-extrabold text-foreground">₹{price}</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Protected booking with verified expert</span>
        </div>

        <Button
          type="submit"
          className="w-full rounded-xl h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs sm:text-sm shadow-md"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing Booking...
            </>
          ) : (
            'Confirm & Request Booking'
          )}
        </Button>
      </div>

      {error && (
        <div className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 font-medium text-center">
          {error}
        </div>
      )}
    </form>
  )
}
