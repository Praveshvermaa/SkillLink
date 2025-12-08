"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "./StarRating";
import { formatDistanceToNow } from "date-fns";

interface Review {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    user: {
        name: string;
        avatar_url: string;
    };
}

interface ReviewListProps {
    reviews: Review[];
}

export function ReviewList({ reviews }: ReviewListProps) {
    if (reviews.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No reviews yet.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {reviews.map((review) => (
                <div key={review.id} className="flex gap-4 border-b pb-6 last:border-0">
                    <Avatar className="h-10 w-10 border">
                        <AvatarImage src={review.user.avatar_url} />
                        <AvatarFallback>
                            {review.user.name?.[0] || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm">{review.user.name}</h4>
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                            </span>
                        </div>
                        <StarRating rating={review.rating} readonly size="sm" />
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            {review.comment}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
