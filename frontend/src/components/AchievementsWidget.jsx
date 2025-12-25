import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Progress } from "@/components/ui/progress";
import { Loader2, Award } from 'lucide-react';


function AchievementsWidget() {
    const { authToken } = useAuth();
    const [stats, setStats] = useState({ completed: 0, total: 0 });
    const [loading, setLoading] = useState(true);

    const fetchAchievements = useCallback(async () => {
        if (!authToken) return;
        setLoading(true);
        try {
            const response = await axios.get('/api/achievements/progress', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            const { grouped, single } = response.data;
            const allAchievements = [...single, ...grouped.flatMap(g => g.achievements)];
            const completedCount = allAchievements.filter(ach => ach.progress?.is_completed).length;

            setStats({
                completed: completedCount,
                total: allAchievements.length
            });
        } catch (err) {
            console.error("Failed to load achievements for widget.");
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        fetchAchievements();
    }, [fetchAchievements]);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    if (stats.total === 0) {
        return <p className="text-sm text-muted-foreground text-center">No achievements available yet.</p>;
    }

    const percentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    return (
        <div className="space-y-3 p-2">
            <div className="flex justify-between items-center text-sm font-medium">
                <span className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    Achievements
                </span>
                <span>{stats.completed} / {stats.total}</span>
            </div>
            <Progress value={percentage} />
            <p className="text-xs text-muted-foreground text-center">
                You've completed {Math.round(percentage)}% of all achievements.
            </p>
        </div>
    );
}

export default AchievementsWidget;
