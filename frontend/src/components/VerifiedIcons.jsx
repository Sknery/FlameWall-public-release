import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, Youtube } from 'lucide-react';import youtubeLogoUrl from '../assets/youtube-logo.svg';

function VerifiedIcons({ user, sx, size = '1em' }) {
  if (!user || (!user.is_verified_youtuber && !user.rank)) {
    return null;
  }

  const powerLevel = user.rank?.power_level || 0;

  if (powerLevel < 800 && !user.is_verified_youtuber) {
      return null;
  }

  return (
    <div className="inline-flex items-center gap-1.5" style={sx}>
      <TooltipProvider delayDuration={100}>
        {powerLevel >= 900 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <img
                data-testid="staff-icon"
                src="/favicon.ico"
                alt="FlameWall Staff"
                style={{ height: size, width: 'auto', verticalAlign: 'middle' }}
              />
            </TooltipTrigger>
            <TooltipContent><p>FlameWall Staff</p></TooltipContent>
          </Tooltip>
        )}

        {powerLevel >= 800 && powerLevel < 900 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Shield data-testid="moderator-icon" style={{ fontSize: size, color: 'hsl(var(--primary))', verticalAlign: 'middle' }} />
            </TooltipTrigger>
            <TooltipContent><p>Verified Moderator</p></TooltipContent>
          </Tooltip>
        )}

        {user.is_verified_youtuber && (
          <Tooltip>
            <TooltipTrigger asChild>
                <img
                  data-testid="youtuber-icon"
                  src={youtubeLogoUrl}
                  alt="Verified YouTuber"
                  style={{ height: size, width: 'auto', verticalAlign: 'middle' }}
                />
            </TooltipTrigger>
            <TooltipContent><p>Verified YouTuber</p></TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}

export default VerifiedIcons;
