
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Link as RouterLink } from 'react-router-dom';


import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2 } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { constructImageUrl } from '../utils/url';

function ClanWarningsList({ warnings, clanId, onWarningDeleted }) {
    const { authToken } = useAuth();
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [warningToDelete, setWarningToDelete] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const handleOpenDeleteModal = (warning) => {
        setWarningToDelete(warning);
        setConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!warningToDelete) return;
        setIsActionLoading(true);
        try {
            await axios.delete(`/api/clans/${clanId}/members/warnings/${warningToDelete.id}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success('Warning has been revoked.');
            onWarningDeleted();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to revoke warning.');
        } finally {
            setIsActionLoading(false);
            setConfirmModalOpen(false);
        }
    };

    if (!warnings || warnings.length === 0) {
        return (
             <Card className="text-center">
                <CardContent className="p-6">
                    <p>No warnings have been issued in this clan.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="space-y-3">
                {warnings.map((warning) => (
                    <Card key={warning.id}>
                        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
                            <div className="flex items-start gap-4">
                                <Avatar>
                                    <AvatarImage src={constructImageUrl(warning.target.pfp_url)} />
                                    <AvatarFallback>{warning.target.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm">
                                        <RouterLink to={`/users/${warning.actor.profile_slug || warning.actor.id}`} className="font-semibold hover:underline">{warning.actor.username}</RouterLink>
                                        {' '}issued a warning to{' '}
                                        <RouterLink to={`/users/${warning.target.profile_slug || warning.target.id}`} className="font-semibold hover:underline">{warning.target.username}</RouterLink>
                                    </p>
                                     <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(warning.created_at), { addSuffix: true })}
                                    </p>
                                    <blockquote className="mt-2 border-l-2 pl-4 italic text-muted-foreground">
                                        "{warning.reason}"
                                    </blockquote>
                                </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleOpenDeleteModal(warning)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Revoke
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <ConfirmationModal
                open={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Warning Revoke"
                content={`Are you sure you want to revoke this warning for "${warningToDelete?.target.username}"?`}
                confirmText="Revoke"
                confirmColor="destructive"
                loading={isActionLoading}
            />
        </>
    );
}

export default ClanWarningsList;
