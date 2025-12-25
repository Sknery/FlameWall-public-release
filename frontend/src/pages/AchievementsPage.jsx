
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal } from 'lucide-react';
import AchievementTree from '../components/AchievementTree';

function AchievementsPage() {
    const { authToken } = useAuth();
    const { setBreadcrumbs } = useBreadcrumbs();
    const [allAchievements, setAllAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAchievements = useCallback(async () => {
        if (!authToken) return;
        setLoading(true);
        try {
            const response = await axios.get('/api/achievements/progress', {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            const { grouped, single } = response.data;
            const flatList = [...single];
            grouped.forEach(group => {
                flatList.push(...group.achievements);
            });

            setAllAchievements(flatList);
        } catch (err) {
            setError('Failed to load achievements.');
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        setBreadcrumbs([
            { label: 'My Profile', link: '/profile/me' },
            { label: 'Achievements' }
        ]);
        fetchAchievements();
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs, fetchAchievements]);

    const handleNodeSelect = (achievement) => {

    };

    if (loading) return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <h1 className="font-sans text-3xl font-bold">Achievement Map</h1>
                <p className="text-sm text-muted-foreground hidden md:block">
                    Drag to explore. Click nodes to see details.
                </p>
            </div>

            <div className="flex-1 min-h-0 border rounded-xl overflow-hidden shadow-sm">
                <AchievementTree
                    achievements={allAchievements}
                    onNodeSelect={handleNodeSelect}
                    isEditorMode={false}                />
            </div>
        </div>
    );
}

export default AchievementsPage;