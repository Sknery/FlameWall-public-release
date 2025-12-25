

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThumbsUp, ThumbsDown } from 'lucide-react';

function VoteButtons({ initialScore = 0, currentUserVote = 0, onVote, disabled = false }) {
    const [displayScore, setDisplayScore] = useState(initialScore);
    const [voteStatus, setVoteStatus] = useState(currentUserVote);

    useEffect(() => {
        setDisplayScore(initialScore);
        setVoteStatus(currentUserVote);
    }, [initialScore, currentUserVote]);

    const handleVoteClick = (newValue) => {
        if (disabled) return;
        onVote(newValue);
    };

    return (
        <TooltipProvider delayDuration={100}>
            <div className="flex items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleVoteClick(1)}
                            disabled={disabled}
                            className={`h-8 w-8 ${voteStatus === 1 ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
                        >
                            <ThumbsUp className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Like</p></TooltipContent>
                </Tooltip>

                <p className="min-w-[24px] text-center text-sm font-bold">{displayScore}</p>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleVoteClick(-1)}
                            disabled={disabled}
                            className={`h-8 w-8 ${voteStatus === -1 ? 'text-destructive' : 'text-muted-foreground'} hover:text-destructive`}
                        >
                            <ThumbsDown className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Dislike</p></TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}

export default VoteButtons;
