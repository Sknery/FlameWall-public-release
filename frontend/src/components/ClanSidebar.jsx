

import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Users, Lock, LockOpen, FileText, Shield } from 'lucide-react';
import { constructImageUrl } from '../utils/url';

const getClanStatusInfo = (joinType) => {
    switch (joinType) {
        case 'open': return { icon: <LockOpen className="h-5 w-5 text-muted-foreground" />, text: 'Open' };
        case 'application': return { icon: <FileText className="h-5 w-5 text-muted-foreground" />, text: 'Application' };
        case 'closed':
        default: return { icon: <Lock className="h-5 w-5 text-muted-foreground" />, text: 'Closed' };
    }
};

function ClanSidebar({ clan, children }) {
    if (!clan) return null;

    const statusInfo = getClanStatusInfo(clan.join_type);

    return (
        <div className="space-y-6 md:w-[320px] md:shrink-0">
            {}
            <Card>
                <div className="relative">
                    <div className="p-4 pb-0">
                        <div
                            className="w-full aspect-[16/5] bg-cover bg-center bg-secondary rounded-lg"
                            style={{ backgroundImage: `url(${constructImageUrl(clan.card_image_url) || '/placeholders/banner_placeholder.png'})` }}
                        ></div>
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[25%] max-w-[80px] min-w-[64px] aspect-square">
                        <Avatar className="h-full w-full aspect-square border-4 border-background">
                            <AvatarImage src={constructImageUrl(clan.card_icon_url)} />
                            <AvatarFallback>
                                <Shield className="h-[60%] w-[60%]" />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>

                <div className="flex flex-col items-center text-center px-4 pb-4 pt-12">
                    <h2 className="font-sans mt-0 text-2xl font-bold">{clan.name}</h2>
                    <p className="text-sm text-muted-foreground">@{clan.tag}</p>
                    <p className="mt-2 text-sm text-muted-foreground break-all smart-wrap">
                        {clan.description || 'No description provided.'}
                    </p>
                    {children && <div className="mt-4 flex w-full flex-col items-center gap-2 sm:flex-row sm:justify-center">{children}</div>}
                </div>
            </Card>

            {}
            <Card>
                <CardHeader>
                    <CardTitle>Info & Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Crown className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm">Owner</span>
                        </div>
                        <RouterLink to={`/users/${clan.owner.profile_slug || clan.owner.id}`} className="font-semibold hover:underline" style={{ color: clan.owner.rank?.display_color }}>
                            {clan.owner.username}
                        </RouterLink>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm">Members</span>
                        </div>
                        <span className="font-semibold">{clan.members.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {statusInfo.icon}
                            <span className="text-sm">Join Status</span>
                        </div>
                        <span className="font-semibold">{statusInfo.text}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default ClanSidebar;
