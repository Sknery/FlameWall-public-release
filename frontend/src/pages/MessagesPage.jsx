

import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';


import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";


import { Search, Loader2, Terminal, User } from 'lucide-react';
import { motion } from 'framer-motion';

import { constructImageUrl } from '../utils/url';
import { listContainer, fadeInUp } from '../utils/animations';

function MessagesPage() {
    const { authToken, socket } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { setBreadcrumbs } = useBreadcrumbs();

    const fetchConversations = useCallback(async () => {
        if (!authToken) return;
        setLoading(true);
        setError(null);
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            const response = await axios.get('/api/messages/list', config);
            setConversations(response.data);
        } catch (err) {
            setError('Failed to load conversations.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        setBreadcrumbs([
            { label: 'My Profile', link: '/profile/me' },
            { label: 'Messages' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        if (!socket) return;
        const handleNewMessage = (message) => {
            fetchConversations();
        };
        socket.on('newMessage', handleNewMessage);
        return () => {
            socket.off('newMessage', handleNewMessage);
        };
    }, [socket, fetchConversations]);

    const filteredConversations = conversations.filter(convo =>
        convo.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="flex flex-col h-full space-y-6">
            <header>
                <h1 className="font-sans text-3xl font-bold">Messages</h1>
                <div className="relative mt-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search conversations..."
                        className="w-full max-w-[300px] pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto pb-4">
                {filteredConversations.length > 0 ? (
                    <motion.div
                        variants={listContainer}
                        initial="initial"
                        animate="animate"
                        className="responsive-grid-messages"
                    >
                        {filteredConversations.map(({ otherUser, lastMessage, unreadCount }) => (
                            <motion.div key={otherUser.id} variants={fadeInUp} className="h-full">
                                <RouterLink to={`/messages/${otherUser.id}`} className="block h-full">
                                    <Card className="h-full hover:bg-accent/50 transition-colors border-border/60 hover:border-primary/40 group">
                                        <CardContent className="flex flex-col p-4 h-full">
                                            <div className="flex items-start gap-3 mb-3">
                                                <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border group-hover:ring-primary/50 transition-all">
                                                    <AvatarImage src={constructImageUrl(otherUser.pfp_url)} />
                                                    <AvatarFallback>
                                                        <User className="h-[60%] w-[60%]" />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <p className="font-semibold truncate text-sm group-hover:text-primary transition-colors" style={{ color: otherUser.rank?.display_color }}>
                                                            {otherUser.username}
                                                        </p>
                                                        {lastMessage && (
                                                            <p className="text-[10px] text-muted-foreground shrink-0 ml-1 whitespace-nowrap">
                                                                {formatDistanceToNow(new Date(lastMessage.sent_at), { addSuffix: true })}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {otherUser.rank?.name || 'User'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-end mt-auto gap-2 pt-2 border-t border-border/40">
                                                <p className="text-xs text-muted-foreground line-clamp-2 break-words leading-relaxed flex-1">
                                                    {lastMessage ? (
                                                        <>
                                                            {lastMessage.sender_id !== otherUser.id && <span className="font-medium text-foreground/80">You: </span>}
                                                            {lastMessage.content}
                                                        </>
                                                    ) : (
                                                        <span className="italic opacity-70">No messages yet...</span>
                                                    )}
                                                </p>
                                                {unreadCount > 0 && (
                                                    <Badge className="shrink-0 h-5 px-1.5 min-w-[1.25rem] justify-center bg-primary animate-pulse">
                                                        {unreadCount}
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </RouterLink>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl">
                        <p className="text-muted-foreground">No conversations found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MessagesPage;