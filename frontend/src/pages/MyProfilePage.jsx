

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link as RouterLink } from 'react-router-dom';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { Edit, Plus, Loader2, Terminal } from 'lucide-react';

import UserPostsList from '../components/UserPostsList';
import UserProfileSidebar from '../components/UserProfileSidebar';

function MyProfilePage() {
    const { user: profile, loading: authLoading, error: authError, socket, updateAuthToken } = useAuth();
    const [error, setError] = useState(authError);
    const loading = authLoading;
    const { setBreadcrumbs } = useBreadcrumbs();

    useEffect(() => {
        setBreadcrumbs([
            { label: 'My Profile' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    useEffect(() => {
        if (!socket) return;
        const handleStatusUpdate = (data) => {
            if (profile && data.userId === profile.id) {
                const newToken = localStorage.getItem('authToken');
                if (newToken) {
                    updateAuthToken(newToken);
                }
            }
        };
        socket.on('userStatusUpdate', handleStatusUpdate);
        return () => {
            socket.off('userStatusUpdate', handleStatusUpdate);
        };
    }, [socket, profile, updateAuthToken]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[80vh]">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className="mt-4">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!profile) return <p>Could not load profile.</p>;

    return (
        <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
            <div className="md:w-[320px] md:shrink-0 h-full overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary">
                    <UserProfileSidebar user={profile}>
                        <Button asChild>
                            <RouterLink to="/posts/new"><Plus className="mr-2" />New Post</RouterLink>
                        </Button>
                        <Button asChild variant="outline">
                            <RouterLink to="/profile/settings"><Edit className="mr-2" />Edit Profile</RouterLink>
                        </Button>
                    </UserProfileSidebar>
                </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-4 h-full overflow-hidden">
                <h2 className="font-sans text-2xl font-bold shrink-0">My Posts</h2>
                <div className="flex-1 min-h-0 overflow-hidden">
                    {!loading && <UserPostsList userId={profile.id} />}
                </div>
            </div>
        </div>
    );
}

export default MyProfilePage;