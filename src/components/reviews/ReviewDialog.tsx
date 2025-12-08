"use client";

import { useState, useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "./StarRating";
import { createReview } from "@/app/reviews/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ReviewDialogProps {
    bookingId: string;
    trigger?: React.ReactNode;
}

export function ReviewDialog({ bookingId, trigger }: ReviewDialogProps) {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [state, action, isPending] = useActionState(createReview, null);

    useEffect(() => {
        if (state?.success) {
            toast.success("Review submitted successfully!");
            setOpen(false);
            setRating(0);
        } else if (state?.error) {
            // Handle object error (zod) or string error
            const errorMessage = typeof state.error === 'string'
                ? state.error
                : "Please check your input.";
            toast.error(errorMessage);
        }
    }, [state]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Rate & Review</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rate your experience</DialogTitle>
                    <DialogDescription>
                        Share your feedback about the service provided.
                    </DialogDescription>
                </DialogHeader>

                <form action={action} className="grid gap-4 py-4">
                    <input type="hidden" name="bookingId" value={bookingId} />
                    <input type="hidden" name="rating" value={rating} />

                    <div className="flex flex-col items-center gap-2">
                        <Label>Rating</Label>
                        <StarRating rating={rating} onRatingChange={setRating} size="lg" />
                        {rating === 0 && <span className="text-xs text-red-500">Please select a rating</span>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="comment">Comment</Label>
                        <Textarea
                            id="comment"
                            name="comment"
                            placeholder="Tell us what you liked or didn't like..."
                            className="min-h-[100px]"
                            required
                            minLength={10}
                            maxLength={500}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending || rating === 0}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Review
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
