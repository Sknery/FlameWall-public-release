import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { motion } from 'framer-motion';


import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Users, User, UserPlus, Send, Ban, Shield, Loader2, Terminal, Check, X, UserX, MessageSquare, MoreVertical } from 'lucide-react';


import { constructImageUrl } from '../utils/url';
import { listContainer, fadeInUp } from '../utils/animations';




const FriendCard = ({ friendship, onAction }) => {
    const { user, friendshipId } = friendship;
    return (
        <Card className="h-full flex flex-col overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 p-0 bg-card/50">
            <div className="flex-grow">
                <RouterLink to={`/users/${user.profile_slug || user.id}`} className="block">
                    <div className="relative">
                        <div className="p-4 pb-0">
                            <div
                                className="w-full aspect-[16/5] bg-cover bg-center bg-secondary rounded-lg"
                                style={{ backgroundImage: `url(${constructImageUrl(user.banner_url) || '/placeholders/banner_placeholder.png'})` }}
                            />
                        </div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[25%] max-w-[80px] min-w-[64px] aspect-square">
                            <Avatar className="h-full w-full border-4 border-background">
                                <AvatarImage src={constructImageUrl(user.pfp_url)} />
                                <AvatarFallback><User className="h-[60%] w-[60%]" /></AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                    <div className="flex flex-col items-center text-center px-4 pb-4 pt-12">
                        <h3 className="text-lg font-semibold">{user.username}</h3>
                        <p className="text-sm font-semibold" style={{ color: user.rank?.display_color }}>
                            {user.rank?.name || 'User'}
                        </p>
                    </div>
                </RouterLink>
            </div>
            <CardContent className="p-4 pt-0 mt-auto">
                 <div className="flex gap-2 w-full">
                     <Button asChild className="flex-1">
                         <RouterLink to={`/messages/${user.id}`}><MessageSquare className="mr-2 h-4 w-4" />Message</RouterLink>
                     </Button>
                     <DropdownMenu>
                         <DropdownMenuTrigger asChild><Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                         <DropdownMenuContent>
                             <DropdownMenuItem asChild><RouterLink to={`/users/${user.profile_slug || user.id}`}>View Profile</RouterLink></DropdownMenuItem>
                             <DropdownMenuItem onClick={() => onAction('remove', friendshipId)}><UserX className="mr-2 h-4 w-4" />Remove Friend</DropdownMenuItem>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => onAction('block', user.id)} className="text-destructive focus:text-destructive"><Ban className="mr-2 h-4 w-4" /> Block User</DropdownMenuItem>
                         </DropdownMenuContent>
                     </DropdownMenu>
                 </div>
            </CardContent>
        </Card>
    );
};


const ActionCard = ({ title, user, children }) => (
    <Card>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={constructImageUrl(user.pfp_url)} />
                    <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm">
                        {title}
                    </p>
                </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
                {children}
            </div>
        </CardContent>
    </Card>
);

function FriendsPage() {
    const { authToken } = useAuth();
    const { friendshipUpdateTrigger } = useNotifications();
    const { setBreadcrumbs } = useBreadcrumbs();

    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [outgoingRequests, setOutgoingRequests] = useState([]);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [clanInvites, setClanInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!authToken) return;
        setLoading(true);
        setError(null);
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            const [friendsRes, pendingRes, outgoingRes, blockedRes, invitesRes] = await Promise.all([
                axios.get(`/api/friendships`, config),
                axios.get(`/api/friendships/requests/pending`, config),
                axios.get(`/api/friendships/requests/outgoing`, config),
                axios.get(`/api/friendships/blocked`, config),
                axios.get(`/api/clan-invitations/pending`, config),
            ]);
            setFriends(friendsRes.data);
            setPendingRequests(pendingRes.data);
            setOutgoingRequests(outgoingRes.data);
            setBlockedUsers(blockedRes.data);
            setClanInvites(invitesRes.data);
        } catch (err) {
            setError('Failed to load data.');
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        setBreadcrumbs([
            { label: 'My Profile', link: '/profile/me' },
            { label: 'Friends' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    useEffect(() => {
        fetchData();
    }, [fetchData, friendshipUpdateTrigger]);

    const handleFriendshipAction = async (action, id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            let endpoint = '';
            let method = 'post';
            let payload = {};

            if (action === 'accept') {
                endpoint = `/api/friendships/requests/${id}/accept`;
                method = 'patch';
            } else if (['reject', 'cancel', 'remove'].includes(action)) {
                endpoint = action === 'remove' ? `/api/friendships/${id}` : `/api/friendships/requests/${id}`;
                method = 'delete';
            } else if (action === 'unblock' || action === 'block') {
                 endpoint = `/api/friendships/block/${id}`;
                 method = action === 'unblock' ? 'delete' : 'post';
            }

            await axios[method](endpoint, (method === 'patch' || method === 'post') ? payload : config, config);
            toast.success('Action successful!');
            fetchData();
        } catch (err) { toast.error(err.response?.data?.message || 'Action failed.'); }
    };

    const handleInviteAction = async (invitationId, action) => {
        try {
            await axios.post(`/api/clan-invitations/${invitationId}/${action}`, {}, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success(`Invitation ${action}ed!`);
            fetchData();
        } catch (err) { toast.error(err.response?.data?.message || `Failed to ${action} invite.`); }
    };

    if (loading) return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    const allRequests = [...clanInvites, ...pendingRequests].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return (
        <div className="space-y-6">
            <h1 className="font-sans text-3xl font-bold">Manage Socials</h1>
            <Tabs defaultValue="friends" className="w-full">
                <div className="sticky top-0 z-10 bg-black pt-4 pb-2 -mx-6 md:-mx-9 px-6 md:px-9">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="friends">
                            <Users className="h-5 w-5 sm:mr-2" />
                            <span className="hidden sm:inline">Friends ({friends.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="requests" className="relative">
                            <UserPlus className="h-5 w-5 sm:mr-2" />
                            <span className="hidden sm:inline">Requests</span>
                            {allRequests.length > 0 && <Badge className="absolute -top-2 -right-2">{allRequests.length}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="sent">
                            <Send className="h-5 w-5 sm:mr-2" />
                            <span className="hidden sm:inline">Sent ({outgoingRequests.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="blocked">
                            <Ban className="h-5 w-5 sm:mr-2" />
                            <span className="hidden sm:inline">Blocked ({blockedUsers.length})</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="friends">
                    {friends.length > 0 ? (
                        <motion.div variants={listContainer} initial="initial" animate="animate" className="responsive-grid mt-4">
                            {friends.map(item => (
                                <motion.div key={item.friendshipId} variants={fadeInUp} className="h-full w-full max-w-[280px]">
                                    <FriendCard friendship={item} onAction={handleFriendshipAction} />
                                </motion.div>
                            ))}
                        </motion.div>

                    ) : <p className="text-muted-foreground text-center py-8">Your friends list is empty.</p>}
                </TabsContent>

                <TabsContent value="requests">
                    {allRequests.length > 0 ? (
                        <motion.div variants={listContainer} initial="initial" animate="animate" className="space-y-3 mt-4">
                            {allRequests.map(item => (
                                <motion.div key={item.id} variants={fadeInUp}>
                                    {item.clan ? (
                                        <ActionCard title={<><strong>{item.inviter.username}</strong> invited you to join <strong>{item.clan.name}</strong></>} user={item.inviter}>
                                            <Button size="sm" onClick={() => handleInviteAction(item.id, 'accept')}><Check className="mr-2 h-4 w-4" />Accept</Button>
                                            <Button size="sm" variant="outline" onClick={() => handleInviteAction(item.id, 'decline')}><X className="mr-2 h-4 w-4" />Decline</Button>
                                        </ActionCard>
                                    ) : (
                                        <ActionCard title={<><strong>{item.requester.username}</strong> sent you a friend request</>} user={item.requester}>
                                            <Button size="sm" onClick={() => handleFriendshipAction('accept', item.id)}><Check className="mr-2 h-4 w-4" />Accept</Button>
                                            <Button size="sm" variant="outline" onClick={() => handleFriendshipAction('reject', item.id)}><X className="mr-2 h-4 w-4" />Decline</Button>
                                        </ActionCard>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : <p className="text-muted-foreground text-center py-8">You have no pending requests.</p>}
                </TabsContent>

                <TabsContent value="sent">
                    {outgoingRequests.length > 0 ? (
                        <motion.div variants={listContainer} initial="initial" animate="animate" className="space-y-3 mt-4">
                            {outgoingRequests.map(item => (
                                <motion.div key={item.id} variants={fadeInUp}>
                                    <ActionCard title={<>Friend request sent to <strong>{item.receiver.username}</strong></>} user={item.receiver}>
                                        <Button variant="secondary" onClick={() => handleFriendshipAction('cancel', item.id)}>Cancel Request</Button>
                                    </ActionCard>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : <p className="text-muted-foreground text-center py-8">You have no outgoing requests.</p>}
                </TabsContent>

                <TabsContent value="blocked">
                    {blockedUsers.length > 0 ? (
                        <motion.div variants={listContainer} initial="initial" animate="animate" className="space-y-3 mt-4">
                            {blockedUsers.map(item => (
                                <motion.div key={item.id} variants={fadeInUp}>
                                    <ActionCard title={<>You have blocked <strong>{item.receiver.username}</strong></>} user={item.receiver}>
                                        <Button variant="outline" onClick={() => handleFriendshipAction('unblock', item.receiver.id)}>Unblock</Button>
                                    </ActionCard>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : <p className="text-muted-foreground text-center py-8">You haven't blocked any users.</p>}
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default FriendsPage;
