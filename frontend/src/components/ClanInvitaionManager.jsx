
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Link as RouterLink } from 'react-router-dom';


import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, User } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { constructImageUrl } from '../utils/url';

function ClanInvitationsManager({ invitations, clanId, onInviteCancelled }) {
    const { authToken } = useAuth();
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [inviteToCancel, setInviteToCancel] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const handleOpenCancelModal = (invite) => {
        setInviteToCancel(invite);
        setConfirmModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!inviteToCancel) return;
        setIsActionLoading(true);
        try {
            await axios.delete(`/api/clans/${clanId}/invitations/${inviteToCancel.id}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success(`Invitation for ${inviteToCancel.invitee.username} cancelled.`);
            onInviteCancelled();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel invitation.');
        } finally {
            setIsActionLoading(false);
            setConfirmModalOpen(false);
        }
    };

    if (!invitations || invitations.length === 0) {
        return (
            <Card className="text-center">
                <CardContent className="p-6">
                    <p>No pending invitations.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="space-y-3">
                {invitations.map((invite) => (
                    <Card key={invite.id}>
                        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={constructImageUrl(invite.invitee.pfp_url)} />
                                    <AvatarFallback>
                                        <User className="h-[60%] w-[60%]" />
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm">
                                        Invitation sent to <RouterLink to={`/users/${invite.invitee.profile_slug || invite.invitee.id}`} className="font-semibold hover:underline">{invite.invitee.username}</RouterLink>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        by {invite.inviter.username} ・ Expires {formatDistanceToNow(new Date(invite.expires_at), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleOpenCancelModal(invite)}>
                                <X className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <ConfirmationModal
                open={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleConfirmCancel}
                title="Confirm Cancellation"
                content={`Are you sure you want to cancel the invitation for "${inviteToCancel?.invitee.username}"?`}
                confirmText="Cancel Invite"
                confirmColor="destructive"
                loading={isActionLoading}
            />
        </>
    );
}

export default ClanInvitationsManager;
