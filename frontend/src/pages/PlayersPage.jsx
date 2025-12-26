

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
    Card, CardContent
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, Circle, ThumbsUp, Shield, CalendarDays, User, ChevronsUpDown, CheckCircle, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


import { constructImageUrl } from '../utils/url';
import { useAuth } from '../context/AuthContext';
import { listContainer, fadeInUp } from '../utils/animations';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import PlayerCard from '../components/PlayerCard';
import { cn } from '@/lib/utils';

function PlayersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('first_login');
    const [order, setOrder] = useState('DESC');
    const { socket } = useAuth();
    const { setBreadcrumbs } = useBreadcrumbs();
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef();

    const [allTags, setAllTags] = useState([]);
    const [selectedTagIds, setSelectedTagIds] = useState([]);
    const [popoverOpen, setPopoverOpen] = useState(false);


    const lastUserElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    const fetchUsers = useCallback(async () => {
        if (!hasMore && page > 1) return;
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/api/users`, {
                params: {
                    sortBy,
                    order,
                    page,
                    limit: 12,
                    tagIds: selectedTagIds.join(',')
                }
            });
            setUsers(prev => page === 1 ? response.data.data : [...prev, ...response.data.data]);
            setHasMore(response.data.data.length > 0);
        } catch (err) {
            setError('Failed to load players list.');
        } finally {
            setLoading(false);
        }
    }, [sortBy, order, page, hasMore, selectedTagIds]);

    useEffect(() => {
        setBreadcrumbs([
            { label: 'Community', link: '/players' },
            { label: 'Players' }
        ]);
        const fetchTags = async () => {
            try {
                const response = await axios.get('/api/tags');
                setAllTags(response.data);
            } catch (error) {
                console.error("Failed to load tags for filter");
            }
        };
        fetchTags();
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    useEffect(() => {
        setUsers([]);
        setPage(1);
        setHasMore(true);
    }, [sortBy, order, selectedTagIds]);

    useEffect(() => {
        if (hasMore) {
            fetchUsers();
        }
    }, [fetchUsers, hasMore]);

    useEffect(() => {
        if (!socket) return;
        const handlePlayerStatusUpdate = (data) => {
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.minecraft_uuid === data.uuid
                        ? { ...user, is_minecraft_online: data.isOnline }
                        : user
                )
            );
        };
        socket.on('playerStatusUpdate', handlePlayerStatusUpdate);
        return () => { socket.off('playerStatusUpdate', handlePlayerStatusUpdate); };
    }, [socket]);

    const handleTagSelect = (tagId) => {
        setSelectedTagIds(prev => {
            if (prev.includes(tagId)) {
                return prev.filter(id => id !== tagId);
            }
            return [...prev, tagId];
        });
    };

    if (error && page === 1) return <Alert variant="destructive" className="mt-4"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    const selectedTags = allTags.filter(tag => selectedTagIds.includes(tag.id));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="font-sans text-3xl font-bold">Community Players</h1>
                <div className="flex gap-2 w-full sm:w-auto">
                     <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full sm:w-[200px] justify-between h-auto min-h-9">
                                <div className="flex flex-wrap gap-1 items-center">
                                    <Tag className="h-4 w-4 mr-2 shrink-0"/>
                                    {selectedTags.length > 0 ? selectedTags.map(tag => <Badge key={tag.id} style={{backgroundColor: tag.color, color: '#fff'}}>{tag.name}</Badge>) : "Filter by tags..."}
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <Command>
                                <CommandInput placeholder="Search tags..." />
                                <CommandList>
                                    <CommandEmpty>No tags found.</CommandEmpty>
                                    <CommandGroup>
                                        {allTags.map((tag) => (
                                            <CommandItem key={tag.id} value={tag.name} onSelect={() => handleTagSelect(tag.id)}>
                                                <CheckCircle className={cn("mr-2 h-4 w-4", selectedTagIds.includes(tag.id) ? "opacity-100" : "opacity-0")}/>
                                                {tag.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="first_login">Join Date</SelectItem>
                            <SelectItem value="reputation_count">Reputation</SelectItem>
                            <SelectItem value="username">Username</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={order} onValueChange={setOrder}>
                        <SelectTrigger className="w-full sm:w-[120px]">
                            <SelectValue placeholder="Order" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DESC">Descending</SelectItem>
                            <SelectItem value="ASC">Ascending</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <motion.div
                variants={listContainer}
                initial="initial"
                animate="animate"
                className="responsive-grid"
            >
                {users.map((user, index) => (
                    <motion.div
                        key={user.id}
                        variants={fadeInUp}
                        className="w-full max-w-[320px]"
                        ref={users.length === index + 1 ? lastUserElementRef : null}
                    >
                        <PlayerCard user={user} />
                    </motion.div>
                ))}
            </motion.div>

            {loading && hasMore && <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            {!loading && !hasMore && users.length > 0 && <p className="text-center text-muted-foreground text-sm py-4">You've reached the end of the list.</p>}
            {!loading && users.length === 0 && <p className="text-muted-foreground text-center py-8">No players found.</p>}
        </div>
    );
}

export default PlayersPage;