

import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, ThumbsUp, Shield, Gamepad2, User, Tag, Edit, Loader2, ZoomIn } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';


import { constructImageUrl } from '../utils/url';
import VerifiedIcons from './VerifiedIcons';
import MinecraftAvatar from './MinecraftAvatar';
import ImageViewerModal from './ImageViewerModal';
const lightenHexColor = (hex, percent) => {
    if (!hex) return '#ffffff';
    hex = hex.replace(/^\s*#|\s*$/g, '');
    if (hex.length === 3) {
        hex = hex.replace(/(.)/g, '$1$1');
    }
    const r = parseInt(hex.substr(0, 2), 16),
          g = parseInt(hex.substr(2, 2), 16),
          b = parseInt(hex.substr(4, 6), 16);

    return '#' +
       ((0|(1<<8) + r + (256 - r) * percent / 100).toString(16)).substr(1) +
       ((0|(1<<8) + g + (256 - g) * percent / 100).toString(16)).substr(1) +
       ((0|(1<<8) + b + (256 - b) * percent / 100).toString(16)).substr(1);
}

function UserProfileSidebar({ user, children }) {
    const { user: currentUser, authToken, refreshUser } = useAuth();
    const [isRankModalOpen, setIsRankModalOpen] = useState(false);
    const [availableRanks, setAvailableRanks] = useState([]);
    const [selectedRankId, setSelectedRankId] = useState('');
    const [isSavingRank, setIsSavingRank] = useState(false);

    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const canManageRank = currentUser &&
                          currentUser.rank?.power_level >= 900 &&                          currentUser.id !== user.id &&
                          currentUser.rank.power_level > (user.rank?.power_level || 0);

    useEffect(() => {
        if (isRankModalOpen && availableRanks.length === 0) {
            const fetchRanks = async () => {
                try {
                    const response = await axios.get('/api/ranks', {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                    const assignableRanks = response.data.filter(r => r.power_level < currentUser.rank.power_level);
                    setAvailableRanks(assignableRanks);
                    setSelectedRankId(String(user.rank_id || ''));
                } catch (error) {
                    toast.error("Failed to load ranks.");
                }
            };
            fetchRanks();
        }
    }, [isRankModalOpen, authToken, user.rank_id, currentUser, availableRanks.length]);

    const handleRankSave = async () => {
        if (!selectedRankId) return;
        setIsSavingRank(true);
        try {
            await axios.patch(`/api/admin/users/${user.id}/update`,
                { rank_id: Number(selectedRankId) },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            toast.success(`Rank updated successfully!`);
            setIsRankModalOpen(false);
            window.location.reload();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update rank.");
        } finally {
            setIsSavingRank(false);
        }
    };

    const handleImageClick = (imageUrl) => {
        if (imageUrl) {
            setSelectedImage(imageUrl);
            setViewerOpen(true);
        }
    };

    if (!user) return null;

    const frameColor = user.profile_frame?.cosmetic_data?.color;
    const lightFrameColor = lightenHexColor(frameColor, 60);

    return (
        <div className="space-y-6 w-full">
            <div className="relative rounded-xl overflow-hidden p-[2px]">
                {frameColor && (
                    <span
                        className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite]"
                        style={{ background: `conic-gradient(from 90deg at 50% 50%, ${lightFrameColor} 0%, ${frameColor} 50%, ${lightFrameColor} 100%)` }}
                    />
                )}

                <div className="relative z-10 rounded-[10px] bg-black">
                    <Card className="border-0 shadow-none">
                        <div className="relative">
                            <div className="p-4 pb-0 group relative">
                                <div
                                    className="w-full aspect-[16/5] bg-cover bg-center bg-secondary rounded-lg cursor-zoom-in transition-opacity hover:opacity-90"
                                    style={{ backgroundImage: `url(${constructImageUrl(user.animated_banner?.image_url || user.banner_url) || '/placeholders/banner_placeholder.png'})` }}
                                    onClick={() => handleImageClick(user.animated_banner?.image_url || user.banner_url || '/placeholders/banner_placeholder.png')}
                                >
                                     {}
                                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                        <ZoomIn className="text-white/80 w-8 h-8 drop-shadow-md" />
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[25%] max-w-[80px] min-w-[64px] aspect-square group cursor-zoom-in"
                                 onClick={() => handleImageClick(user.animated_avatar?.image_url || user.pfp_url)}
                            >
                                <Avatar className="h-full w-full aspect-square border-4 border-background transition-transform group-hover:scale-105 relative z-20">
                                    <AvatarImage src={constructImageUrl(user.animated_avatar?.image_url || user.pfp_url)} />
                                    <AvatarFallback>
                                        <User className="h-[60%] w-[60%]" />
                                    </AvatarFallback>
                                    {}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full">
                                         <ZoomIn className="text-white/90 w-6 h-6 drop-shadow-md" />
                                    </div>
                                </Avatar>
                            </div>
                        </div>
                        <div className="flex flex-col items-center text-center px-4 pb-4 pt-12">
                            <h2 className="font-sans mt-0 flex items-center gap-2 text-2xl font-bold">
                                <RouterLink to={`/users/${user.profile_slug || user.id}`} className="hover:underline">
                                    {user.username}
                                </RouterLink>
                                <VerifiedIcons user={user} />
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground break-all smart-wrap">
                                {user.description || 'No description provided.'}
                            </p>
                            {children && <div className="mt-4 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">{children}</div>}
                        </div>
                    </Card>
                </div>
            </div>

            {}
            <div className="flex justify-center gap-4">
                {Array.from({ length: 3 }).map((_, index) => {
                    const tag = user.tags?.[index];
                    if (tag) {
                        return (
                            <TooltipProvider key={tag.id}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="h-12 w-12 rounded-lg flex items-center justify-center p-1" style={{ backgroundColor: tag.color }}>
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={constructImageUrl(tag.icon_url)} className="p-1" />
                                                <AvatarFallback className="bg-transparent rounded-sm" />
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
                        <div key={`placeholder-${index}`} className="h-12 w-12 rounded-lg bg-background border-2 border-dashed flex items-center justify-center">
                            <Tag className="h-5 w-5 text-muted-foreground" />
                        </div>
                    );
                })}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Stats</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pt-0 pb-6 space-y-4">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><Crown className="h-5 w-5 text-muted-foreground" /><span className="text-sm">Rank</span></div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold" style={{ color: user.rank?.display_color }}>{user.rank?.name || 'User'}</span>
                            {canManageRank && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2" onClick={() => setIsRankModalOpen(true)}>
                                    <Edit className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><ThumbsUp className="h-5 w-5 text-muted-foreground" /><span className="text-sm">Reputation</span></div>
                        <span className="font-semibold">{user.reputation_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><Shield className="h-5 w-5 text-muted-foreground" /><span className="text-sm">Clan</span></div>
                        {user.clanMembership ? (
                            <RouterLink to={`/clans/${user.clanMembership.clan.tag}`} className="font-semibold hover:underline">{user.clanMembership.clan.name}</RouterLink>
                        ) : (
                            <span className="text-sm text-muted-foreground">None</span>
                        )}
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><Gamepad2 className="h-5 w-5 text-muted-foreground" /><span className="text-sm">Minecraft</span></div>
                        {user.minecraft_uuid ? (
                            <div className="flex items-center gap-2 font-semibold">
                                <MinecraftAvatar user={user} size={20} />
                                <span>{user.minecraft_username}</span>
                            </div>
                        ) : (
                            <span className="text-sm text-muted-foreground">Not Linked</span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {}
            <Dialog open={isRankModalOpen} onOpenChange={setIsRankModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Change User Rank</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select New Rank</Label>
                            <Select value={selectedRankId} onValueChange={setSelectedRankId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a rank..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableRanks.map(rank => (
                                        <SelectItem key={rank.id} value={String(rank.id)}>
                                            <span style={{ color: rank.display_color }}>{rank.name}</span>
                                            <span className="text-muted-foreground ml-2 text-xs">({rank.power_level})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Note: Changing a rank may execute commands on the game server if configured.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRankModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleRankSave} disabled={isSavingRank}>
                            {isSavingRank && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {}
            <ImageViewerModal
                open={viewerOpen}
                onClose={() => setViewerOpen(false)}
                imageUrl={selectedImage}
                altText={`${user.username}'s media`}
            />
        </div>
    );
}

export default UserProfileSidebar;