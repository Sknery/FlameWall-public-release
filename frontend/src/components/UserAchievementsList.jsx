
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';


import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal } from 'lucide-react';


import AchievementCard from './AchievementCard';
import { listContainer, fadeInUp } from '../utils/animations';

function UserAchievementsList() {
    const { authToken } = useAuth();
    const [achievementData, setAchievementData] = useState({ grouped: [], single: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAchievements = useCallback(async () => {
        if (!authToken) return;
        setLoading(true);
        try {
            const response = await axios.get('/api/achievements/progress', { headers: { Authorization: `Bearer ${authToken}` } });
            setAchievementData(response.data);
        } catch (err) {
            setError('Failed to load achievements progress.');
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        fetchAchievements();
    }, [fetchAchievements]);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    const { grouped, single } = achievementData;
    const defaultOpenAccordions = grouped.map(group => `group-${group.groupInfo.id}`);

    if (grouped.length === 0 && single.length === 0) {
        return <p className="text-muted-foreground">No achievements available yet.</p>;
    }

    return (
        <div className="space-y-8">
            {grouped.length > 0 && (
                <div>
                    <h2 className="font-sans text-2xl font-bold mb-4">Grouped Achievements</h2>
                    <Accordion type="multiple" defaultValue={defaultOpenAccordions}>
                        {grouped.map(({ groupInfo, achievements }) => (
                            <AccordionItem value={`group-${groupInfo.id}`} key={groupInfo.id}>
                                <AccordionTrigger className="text-xl font-semibold">{groupInfo.name}</AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-muted-foreground mb-4">{groupInfo.description}</p>
                                    <motion.div
                                        variants={listContainer}
                                        initial="initial"
                                        animate="animate"
                                        className="responsive-grid"
                                     >
                                        {achievements.map((ach) => (
                                            <motion.div key={ach.id} variants={fadeInUp} className="w-full">
                                                <AchievementCard achievement={ach} />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            )}

            {single.length > 0 && (
                <div>
                    <h2 className="font-sans text-2xl font-bold mb-4">General Achievements</h2>
                     <motion.div
                        variants={listContainer}
                        initial="initial"
                        animate="animate"
                        className="responsive-grid"
                    >
                        {single.map((ach) => (
                            <motion.div key={ach.id} variants={fadeInUp} className="w-full">
                                <AchievementCard achievement={ach} />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            )}
        </div>
    );
}

export default UserAchievementsList;