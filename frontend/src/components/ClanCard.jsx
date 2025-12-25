

import React from 'react';
import { Link as RouterLink } from 'react-router-dom';


import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from '@/components/ui/separator';
import { Users, Lock, LockOpen, FileText, Shield } from 'lucide-react';


import { constructImageUrl } from '../utils/url';


const getClanStatus = (joinType) => {
    switch (joinType) {
        case 'open':
            return { icon: <LockOpen className="h-4 w-4" />, text: 'Open' };
        case 'application':
            return { icon: <FileText className="h-4 w-4" />, text: 'Application' };
        case 'closed':
        default:
            return { icon: <Lock className="h-4 w-4" />, text: 'Closed' };
    }
};

function ClanCard({ clan }) {
    const status = getClanStatus(clan.join_type);

    return (
        <Card className="h-full flex flex-col overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 p-0 bg-card/50">
            <RouterLink to={`/clans/${clan.tag}`} className="block flex-grow">
                <div className="relative">
                    <div className="p-4 pb-0">
                        <div
                            className="w-full aspect-[16/5] bg-cover bg-center bg-secondary rounded-lg"
                            style={{ backgroundImage: `url(${constructImageUrl(clan.card_image_url) || '/placeholders/banner_placeholder.png'})` }}
                        />
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[25%] max-w-[80px] min-w-[64px] aspect-square">
                        <Avatar className="h-full w-full border-4 border-background">
                            <AvatarImage src={constructImageUrl(clan.card_icon_url)} />
                            <AvatarFallback>
                                <Shield className="h-[60%] w-[60%]" />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
                <div className="flex flex-col items-center text-center px-4 pb-4 pt-12">
                    <h3 className="mt-0 text-lg font-semibold">{clan.name}</h3>
                    <p className="text-sm text-muted-foreground">@{clan.tag}</p>
                </div>
            </RouterLink>
            <CardContent className="px-4 pb-4 mt-auto space-y-2 pt-0">
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Members</span>
                    </div>
                    <span className="font-semibold">{clan.member_count || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        {status.icon}
                        <span>Status</span>
                    </div>
                    <span className="font-semibold">{status.text}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Avatar className="h-4 w-4">
                            <AvatarImage src={constructImageUrl(clan.owner?.pfp_url)} />
                            <AvatarFallback>{clan.owner?.username?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <span>Leader</span>
                    </div>
                    <span className="font-semibold">{clan.owner?.username || 'N/A'}</span>
                </div>
            </CardContent>
        </Card>
    );
}

export default ClanCard;
