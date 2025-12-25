
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal } from 'lucide-react';

function TransferOwnershipModal({ open, onClose, clan, onSuccess }) {
    const { authToken } = useAuth();
    const [selectedNewOwnerId, setSelectedNewOwnerId] = useState('');
    const [selectedNewRoleId, setSelectedNewRoleId] = useState('');
    const [confirmationTag, setConfirmationTag] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const memberOptions = useMemo(() =>
        clan.members.filter(m => m.user_id !== clan.owner_id),
        [clan.members, clan.owner_id]
    );

    const roleOptions = useMemo(() =>
        clan.roles.filter(r => r.power_level < 1000),
        [clan.roles]
    );

    const isFormValid = selectedNewOwnerId && selectedNewRoleId && confirmationTag === clan.tag;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
        setLoading(true);
        setError('');
        try {
            await axios.post(
                `/api/clans/${clan.tag}/transfer-ownership`,
                {
                    newOwnerId: Number(selectedNewOwnerId),
                    oldOwnerNewRoleId: Number(selectedNewRoleId),
                },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            toast.success('Ownership transferred successfully!');
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to transfer ownership.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent as="form" onSubmit={handleSubmit} className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Transfer Clan Ownership</DialogTitle>
                    <DialogDescription>
                        This action is irreversible. You will lose all owner permissions.
                    </DialogDescription>
                </DialogHeader>
                {error && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-owner">Select New Owner</Label>
                        <Select value={selectedNewOwnerId} onValueChange={setSelectedNewOwnerId}>
                            <SelectTrigger id="new-owner"><SelectValue placeholder="Choose a member..." /></SelectTrigger>
                            <SelectContent>{memberOptions.map(member => <SelectItem key={member.id} value={String(member.user_id)}>{member.user.username}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-role">Your New Role</Label>
                        <Select value={selectedNewRoleId} onValueChange={setSelectedNewRoleId}>
                            <SelectTrigger id="new-role"><SelectValue placeholder="Choose your new role..." /></SelectTrigger>
                            <SelectContent>{roleOptions.map(role => <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-tag">To confirm, type the clan tag: <strong>{clan.tag}</strong></Label>
                        <Input id="confirm-tag" value={confirmationTag} onChange={(e) => setConfirmationTag(e.target.value)} autoComplete="off" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="destructive" disabled={loading || !isFormValid}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Transfer Ownership
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default TransferOwnershipModal;
