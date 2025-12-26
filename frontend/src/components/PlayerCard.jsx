
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';
import {
    Card, CardContent
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from '@/components/ui/separator';
import { ThumbsUp, Shield, CalendarDays, User } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { constructImageUrl } from '../utils/url';
import VerifiedIcons from './VerifiedIcons';

const PlayerCard = ({ 
    user, 
    customAvatarUrl = null, 
    customBannerUrl = null, 
    customFrameColor = null,
    disableLink = false,
    showShopFooter = false,
    shopFooterContent = null,
    shopFooterAlwaysVisible = false
}) => {
    const displayUser = {
        ...user,
        pfp_url: customAvatarUrl || user.pfp_url,
        banner_url: customBannerUrl || user.banner_url,
    };

    const frameColor = customFrameColor;
    const lightFrameColor = frameColor ? lightenHexColor(frameColor, 60) : null;

    const cardContent = (
        <Card className={cn(
            "h-full flex flex-col overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 p-0 bg-background border-secondary hover:border-primary",
            frameColor && "relative rounded-xl overflow-hidden p-[2px]"
        )}>
            {frameColor && (
                <span 
                    className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] z-0" 
                    style={{ background: `conic-gradient(from 90deg at 50% 50%, ${lightFrameColor} 0%, ${frameColor} 50%, ${lightFrameColor} 100%)` }}
                />
            )}
            <div className={cn(
                "h-full flex flex-col",
                frameColor && "relative z-10 bg-card rounded-[10px]"
            )}>
                {!disableLink ? (
                    <RouterLink to={`/users/${displayUser.profile_slug || displayUser.id}`} className="block flex-grow">
                        {renderCardContent(displayUser)}
                    </RouterLink>
                ) : (
                    <div className="flex-grow">
                        {renderCardContent(displayUser)}
                    </div>
                )}
                <CardContent className="px-4 pb-4 mt-auto space-y-2 pt-0">
                    <div className="flex justify-center gap-2 mb-3">
                        {Array.from({ length: 3 }).map((_, index) => {
                            const tag = displayUser.tags?.[index];
                            if (tag) {
                                return (
                                    <TooltipProvider key={tag.id}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="h-8 w-8 rounded-md flex items-center justify-center" style={{ backgroundColor: tag.color }}>
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={constructImageUrl(tag.icon_url)} />
                                                        <AvatarFallback className="bg-transparent" />
                                                    </Avatar>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{tag.name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                );
                            }
                            return (
                                <div key={`placeholder-${index}`} className="h-8 w-8 rounded-md bg-muted border border-dashed" />
                            );
                        })}
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <ThumbsUp className="h-4 w-4" />
                            <span>Reputation</span>
                        </div>
                        <span className="font-semibold">{displayUser.reputation_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Shield className="h-4 w-4" />
                            <span>Clan</span>
                        </div>
                        {displayUser.clanMembership ? (
                            <div className="text-right">
                                <p className="font-semibold">{displayUser.clanMembership.clan.name}</p>
                            </div>
                        ) : (
                            <span className="text-muted-foreground text-xs">None</span>
                        )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            <span>Joined</span>
                        </div>
                        <span className="font-semibold">{format(new Date(displayUser.first_login || new Date()), 'MMM d, yyyy')}</span>
                    </div>
                </CardContent>
            </div>
        </Card>
    );

    if (showShopFooter && shopFooterContent) {
        return (
            <div className="flex flex-col h-full group">
                {cardContent}
                {shopFooterAlwaysVisible && (
                    <div className="mt-4 bg-background border border-border rounded-lg p-4">
                        {shopFooterContent}
                    </div>
                )}
            </div>
        );
    }

    return cardContent;
};

const renderCardContent = (user) => (
    <>
        <div className="relative">
            <div className="p-4 pb-0">
                <div
                    className="w-full aspect-[16/5] bg-cover bg-center bg-secondary rounded-lg"
                    style={{ backgroundImage: `url(${constructImageUrl(user.banner_url) || '/placeholders/banner_placeholder.png'})` }}
                />
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[25%] max-w-[80px] min-w-[64px] aspect-square">
                <div className="relative w-full h-full">
                    <Avatar className="h-full w-full border-4 border-background">
                        <AvatarImage src={constructImageUrl(user.pfp_url)} />
                        <AvatarFallback>
                            <User className="h-[60%] w-[60%]" />
                        </AvatarFallback>
                    </Avatar>
                    {user.minecraft_username && (
                        <span
                            className={cn(
                                "absolute bottom-1 right-1 block h-3.5 w-3.5 rounded-full ring-2 ring-background z-10",
                                user.is_minecraft_online ? "bg-green-500" : "bg-slate-400"
                            )}
                            title={user.is_minecraft_online ? "Online in Minecraft" : "Offline"}
                        />
                    )}
                </div>
            </div>
        </div>
        <div className="flex flex-col items-center text-center px-4 pb-2 pt-12">
            <h3 className="text-lg font-semibold flex items-center gap-1.5">
                {user.username}
                <VerifiedIcons user={user} />
            </h3>
            <p className="text-sm font-semibold" style={{ color: user.rank?.display_color }}>
                {user.rank?.name || 'User'}
            </p>
        </div>
    </>
);

const lightenHexColor = (hex, percent) => {
    if (!hex) return '#ffffff';
    hex = hex.replace(/^\s*#|\s*$/g, '');
    if (hex.length === 3) hex = hex.replace(/(.)/g, '$1$1');
    const r = parseInt(hex.substr(0, 2), 16), g = parseInt(hex.substr(2, 2), 16), b = parseInt(hex.substr(4, 6), 16);
    return '#' +
       ((0|(1<<8) + r + (256 - r) * percent / 100).toString(16)).substr(1) +
       ((0|(1<<8) + g + (256 - g) * percent / 100).toString(16)).substr(1) +
       ((0|(1<<8) + b + (256 - b) * percent / 100).toString(16)).substr(1);
};

export default PlayerCard;

