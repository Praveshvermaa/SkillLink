"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: "sm" | "md" | "lg";
}

export function StarRating({
    rating,
    maxRating = 5,
    onRatingChange,
    readonly = false,
    size = "md",
}: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState<number | null>(null);

    const handleMouseEnter = (index: number) => {
        if (!readonly) {
            setHoverRating(index);
        }
    };

    const handleMouseLeave = () => {
        if (!readonly) {
            setHoverRating(null);
        }
    };

    const handleClick = (index: number) => {
        if (!readonly && onRatingChange) {
            onRatingChange(index);
        }
    };

    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
    };

    return (
        <div className="flex gap-1">
            {Array.from({ length: maxRating }).map((_, i) => {
                const index = i + 1;
                const isFilled = (hoverRating !== null ? hoverRating : rating) >= index;

                return (
                    <Star
                        key={index}
                        className={cn(
                            sizeClasses[size],
                            "transition-colors",
                            isFilled
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-muted text-muted-foreground",
                            !readonly && "cursor-pointer hover:scale-110"
                        )}
                        onMouseEnter={() => handleMouseEnter(index)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleClick(index)}
                    />
                );
            })}
        </div>
    );
}
