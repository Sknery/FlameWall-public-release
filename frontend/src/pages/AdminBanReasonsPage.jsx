import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion } from 'framer-motion';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Terminal, Plus, Trash2, Gavel, Calendar } from 'lucide-react';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';


import ConfirmationModal from '../components/ConfirmationModal';
import { listContainer, fadeInUp } from '../utils/animations';

function AdminBanReasonsPage() {
    const { authToken } = useAuth();
    const [reasons, setReasons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newReason, setNewReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { setBreadcrumbs } = useBreadcrumbs();

    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [reasonToDelete, setReasonToDelete] = useState(null);

    const fetchReasons = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/admin/ban-reasons', { headers: { Authorization: `Bearer ${authToken}` } });
            setReasons(response.data);
        } catch (err) {
            setError('Failed to load ban reasons.');
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        setBreadcrumbs([
            { label: 'Admin Panel' },
            { label: 'Ban Reasons' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    useEffect(() => {
        fetchReasons();
    }, [fetchReasons]);

    const handleAddReason = async (e) => {
        e.preventDefault();
        if (!newReason.trim()) return;
        setIsSubmitting(true);
        try {
            await axios.post('/api/admin/ban-reasons', { reason: newReason }, { headers: { Authorization: `Bearer ${authToken}` } });
            setNewReason('');
            toast.success('Ban reason added!');
            fetchReasons();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add reason.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenDeleteModal = (reason) => {
        setReasonToDelete(reason);
        setConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!reasonToDelete) return;
        setIsSubmitting(true);
        try {
            await axios.delete(`/api/admin/ban-reasons/${reasonToDelete.id}`, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success('Ban reason deleted!');
            fetchReasons();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete reason.');
        } finally {
            setIsSubmitting(false);
            setConfirmModalOpen(false);
        }
    };

    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                <h1 className="font-sans text-3xl font-bold">Manage Ban Reasons</h1>

                {}
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" /> Add New Reason
                        </CardTitle>
                        <CardDescription>Create a new preset reason for banning users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddReason} className="flex gap-3 items-center">
                            <Input
                                placeholder="e.g., Use of inappropriate language"
                                value={newReason}
                                onChange={(e) => setNewReason(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                <span className="ml-2 hidden sm:inline">Add</span>
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">Existing Presets ({reasons.length})</h2>

                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                ) : reasons.length > 0 ? (
                    <motion.div
                        variants={listContainer}
                        initial="initial"
                        animate="animate"
                        className="responsive-grid"
                    >
                        {reasons.map((reason) => (
                            <motion.div key={reason.id} variants={fadeInUp} layout>
                                <Card className="h-full flex flex-col hover:border-destructive/40 transition-colors group">
                                    <CardHeader className="pb-2 space-y-0">
                                        <div className="flex justify-between items-start">
                                            <div className="bg-muted p-2 rounded-md group-hover:bg-destructive/10 transition-colors">
                                                <Gavel className="h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors" />
                                            </div>
                                            <Badge variant="outline" className="text-[10px] opacity-70">
                                                ID: {reason.id}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 pt-4">
                                        <p className="font-medium leading-snug">{reason.reason}</p>
                                    </CardContent>
                                    <Separator />
                                    <CardFooter className="p-3 bg-muted/30 flex justify-between items-center">
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <Calendar className="mr-1.5 h-3 w-3" />
                                            {new Date(reason.created_at).toLocaleDateString()}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleOpenDeleteModal(reason)}
                                            className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
                        <Gavel className="h-10 w-10 mb-2 opacity-20" />
                        <p>No preset reasons found.</p>
                    </div>
                )}
            </div>

            <ConfirmationModal
                open={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                content={`Are you sure you want to delete the reason: "${reasonToDelete?.reason}"?`}
                confirmText="Delete"
                confirmColor="destructive"
                loading={isSubmitting}
            />
        </div>
    );
}

export default AdminBanReasonsPage;