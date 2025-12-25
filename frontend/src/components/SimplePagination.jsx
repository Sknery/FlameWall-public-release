import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SimplePagination = ({ count, page, onChange }) => {
    if (count <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2">
            <Button
                variant="outline"
                size="icon"
                disabled={page === 1}
                onClick={(e) => onChange(e, page - 1)}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-medium">
                Page {page} of {count}
            </p>
            <Button
                variant="outline"
                size="icon"
                disabled={page === count}
                onClick={(e) => onChange(e, page + 1)}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default SimplePagination;
