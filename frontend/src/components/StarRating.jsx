import React from 'react';
import { Star } from 'lucide-react';
import { cn } from "@/lib/utils";

const StarRating = ({ value = 0, onChange, readOnly = false, className }) => {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div className={cn("flex items-center", className)}>
      {stars.map((starValue) => (
        <button
          type="button"
          key={starValue}
          onClick={!readOnly ? () => onChange(starValue) : undefined}
          className={cn(
            "p-1",
            !readOnly && "cursor-pointer hover:scale-110 transition-transform"
          )}
          disabled={readOnly}
        >
          <Star
            className={cn(
              "h-5 w-5",
              starValue <= value
                ? "fill-current text-yellow-500"
                : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;