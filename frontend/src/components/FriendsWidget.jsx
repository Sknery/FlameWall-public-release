import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User } from 'lucide-react';
import { constructImageUrl } from '../utils/url';

function FriendsWidget() {
    const { authToken } = useAuth();
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFriends = useCallback(async () => {
        if (!authToken) return;
        setLoading(true);
        try {
            const response = await axios.get('/api/friendships', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setFriends(response.data);
        } catch (err) {
            console.error("Failed to load friends for widget.");
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        fetchFriends();
    }, [fetchFriends]);

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>;

    if (friends.length === 0) {
        return <p className="text-sm text-muted-foreground text-center">No friends to show.</p>;
    }

    return (
        <div className="space-y-3">
            {friends.map(({ user }) => (
                <RouterLink key={user.id} to={`/users/${user.profile_slug || user.id}`} className="block">
                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={constructImageUrl(user.pfp_url)} />
                            <AvatarFallback><User /></AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm">{user.username}</p>
                            <p className="text-xs text-muted-foreground">{user.rank?.name || 'User'}</p>
                        </div>
                    </div>
                </RouterLink>
            ))}
        </div>
    );
}

export default FriendsWidget;
