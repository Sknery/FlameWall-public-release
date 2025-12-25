

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink, useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
    Loader2, Terminal, Users, LogIn, LogOut, Edit, MoreVertical, MessageSquare, UserX,
    ShieldAlert, VolumeX, Volume2, FileText
} from 'lucide-react';


import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { constructImageUrl } from '../utils/url';
import ClanApplicationModal from '../components/ClanApplicationModal';
import ClanSidebar from '../components/ClanSidebar';

const ClanActionModal = ({ isOpen, onClose, actionType, member, clan, onActionSuccess }) => {
    const { authToken } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');

    useEffect(() => {
        if (member) {
            setFormData({
                roleId: member.role_id,
                reason: '',
                duration_minutes: ''
            });
        }
    }, [member, actionType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            let endpoint = `/api/clans/${clan.id}/members/${member.id}`;
            let payload = {};
            let method = 'post';

            switch (actionType) {
                case 'kick':
                    method = 'delete';
                    payload = { reason: formData.reason };
                    break;
                case 'warn':
                    endpoint += '/warn';
                    payload = { reason: formData.reason };
                    break;
                case 'mute':
                    endpoint += '/mute';
                    payload = { reason: formData.reason, duration_minutes: formData.duration_minutes ? Number(formData.duration_minutes) : undefined };
                    break;
                case 'unmute':
                    endpoint += '/unmute';
                    break;
                case 'role':
                    method = 'patch';
                    payload = { roleId: formData.roleId };
                    break;
                default:
                    throw new Error('Invalid action type');
            }

            await axios({ method, url: endpoint, data: payload, headers: config.headers });

            toast.success(`Action '${actionType}' completed successfully for ${member.user.username}.`);
            onActionSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const titles = {
        kick: "Kick Member", warn: "Issue Warning", mute: "Mute Member", unmute: "Unmute Member", role: "Change Member Role"
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{titles[actionType]}: {member?.user.username}</DialogTitle>
                    </DialogHeader>
                    {error && <Alert variant="destructive" className="my-4"><Terminal className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                    <div className="py-4 space-y-4">
                        {actionType === 'role' && (
                            <div className="space-y-2">
                                <Label>New Role</Label>
                                <Select value={String(formData.roleId)} onValueChange={(val) => setFormData(p => ({ ...p, roleId: Number(val) }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {clan?.roles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name} (Lvl: {r.power_level})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {['kick', 'warn', 'mute'].includes(actionType) && (
                            <div className="space-y-2">
                                <Label>Reason</Label>
                                <Textarea value={formData.reason || ''} onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))} required={actionType !== 'kick'} />
                            </div>
                        )}
                        {actionType === 'mute' && (
                            <div className="space-y-2">
                                <Label>Duration (in minutes)</Label>
                                <Input type="number" value={formData.duration_minutes || ''} onChange={(e) => setFormData(p => ({ ...p, duration_minutes: e.target.value }))} placeholder="Leave empty for permanent" />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const MemberCard = ({ member, canManage, onAction, currentUserMembership }) => {
    const isSelf = currentUserMembership?.user_id === member.user_id;
    const canPerformActionOnTarget = !isSelf && currentUserMembership && member.role &&
        currentUserMembership.role.power_level > member.role.power_level;

    return (
        <Card>
            <CardContent className="flex items-center justify-between p-3">
                <RouterLink to={`/users/${member.user.profile_slug || member.user.id}`} className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={constructImageUrl(member.user.pfp_url)} />
                        <AvatarFallback>{member.user.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold" style={{ color: member.user.rank?.display_color }}>{member.user.username}</p>
                        <p className="text-xs" style={{ color: member.role.color }}>{member.role.name}</p>
                    </div>
                </RouterLink>
                {canManage && canPerformActionOnTarget && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onAction('role', member)}><Edit className="mr-2 h-4 w-4" />Change Role</DropdownMenuItem>
                            {member.is_muted ? <DropdownMenuItem onClick={() => onAction('unmute', member)}><Volume2 className="mr-2 h-4 w-4" />Unmute</DropdownMenuItem> : <DropdownMenuItem onClick={() => onAction('mute', member)}><VolumeX className="mr-2 h-4 w-4" />Mute</DropdownMenuItem>}
                            <DropdownMenuItem onClick={() => onAction('warn', member)}><ShieldAlert className="mr-2 h-4 w-4" />Issue Warning</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onAction('kick', member)} className="text-destructive focus:text-destructive"><UserX className="mr-2 h-4 w-4" />Kick Member</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </CardContent>
        </Card>
    );
};


function ClanDetailPage() {
    const { tag } = useParams();
    const { togglePanel } = useOutletContext();
    const { authToken, user: currentUser, isLoggedIn, updateAuthToken } = useAuth();
    const { setBreadcrumbs } = useBreadcrumbs();

    const [clan, setClan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [modalState, setModalState] = useState({ type: null, data: null });

    const fetchData = useCallback(async () => {
        setError(null);
        try {
            const config = authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {};
            const clanResponse = await axios.get(`/api/clans/${tag}`, config);
            setClan(clanResponse.data);
        } catch (err) {
            setError('Failed to load clan data. This clan may not exist.');
        } finally {
            setLoading(false);
        }
    }, [tag, authToken]);

    useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);

    useEffect(() => {
        if (clan) {
            setBreadcrumbs([{ label: 'Community', link: '/clans' }, { label: 'Clans', link: '/clans' }, { label: clan.name }]);
        }
        return () => setBreadcrumbs([]);
    }, [clan, setBreadcrumbs]);

    const handleAction = async (actionType, data = {}) => {
        setIsActionLoading(true);
        try {
            let response;
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            switch (actionType) {
                case 'join':
                    response = await axios.post(`/api/clans/${clan.id}/join`, {}, config);
                    const profileResponse = await axios.get('/api/auth/profile', config);
                    updateAuthToken(profileResponse.data.access_token);
                    break;
                case 'apply':
                    response = await axios.post(`/api/clans/${clan.id}/apply`, { answers: data }, config);
                    break;
                case 'leave':
                    if (window.confirm('Are you sure you want to leave this clan?')) {
                        response = await axios.post(`/api/clans/${clan.id}/leave`, {}, config);
                        const profileResLeave = await axios.get('/api/auth/profile', config);
                        updateAuthToken(profileResLeave.data.access_token);
                    } else {
                        setIsActionLoading(false); return;
                    }
                    break;
                default:
                    throw new Error("Unknown action type");
            }
            toast.success(response.data?.message || 'Action successful!');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Action failed.');
        } finally {
            setIsActionLoading(false);
            setModalState({ type: null, data: null });
        }
    };

    if (loading) return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    if (!clan) return null;

    const isMember = isLoggedIn && clan.members.some(m => m.user_id === currentUser?.id);
    const isOwner = isLoggedIn && clan.owner_id === currentUser?.id;
    const currentUserMembership = clan.members.find(m => m.user_id === currentUser?.id);
    const canManageAnyMember = isOwner || (currentUserMembership && currentUserMembership.role?.permissions.memberPermissions.maxKickPower > 0);

    const renderActionButtons = () => {
        if (!isLoggedIn) return <Button asChild><RouterLink to="/login"><LogIn className="mr-2 h-4 w-4" />Log in to join</RouterLink></Button>;
        if (isMember) {
            const canManage = isOwner || currentUserMembership?.role?.permissions?.clanPermissions?.canEditDetails;
            return (
                <div className="flex gap-2">
                    {canManage && <Button asChild variant="secondary"><RouterLink to={`/clans/${clan.tag}/manage`}><Edit className="mr-2 h-4 w-4" />Manage</RouterLink></Button>}
                    {isMember && <Button onClick={() => togglePanel('clan')}><MessageSquare className="mr-2 h-4 w-4" />Chat</Button>}
                    {!isOwner && <Button variant="outline" onClick={() => handleAction('leave')} disabled={isActionLoading}><LogOut className="mr-2 h-4 w-4" />Leave</Button>}
                </div>
            );
        }
        switch (clan.join_type) {
            case 'open': return <Button onClick={() => handleAction('join')} disabled={isActionLoading}>Join Now</Button>;
            case 'application': return <Button variant="outline" onClick={() => setModalState({ type: 'apply' })}><FileText className="mr-2 h-4 w-4" />Apply</Button>;
            default: return <Button disabled>Closed</Button>;
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-[320px] md:shrink-0 space-y-6">
                <ClanSidebar clan={clan}>{renderActionButtons()}</ClanSidebar>
            </div>
            <div className="flex-1 min-w-0 space-y-4">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Users /> Members ({clan.members.length})</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {clan.members.map(m => (
                                <MemberCard
                                    key={m.id}
                                    member={m}
                                    canManage={canManageAnyMember}
                                    currentUserMembership={currentUserMembership}
                                    onAction={(action, member) => setModalState({ type: action, data: member })}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <ClanApplicationModal open={modalState.type === 'apply'} onClose={() => setModalState({ type: null })} clan={clan} onSubmit={(answers) => handleAction('apply', answers)} />
            <ClanActionModal
                isOpen={modalState.type && modalState.type !== 'apply'}
                onClose={() => setModalState({ type: null, data: null })}
                actionType={modalState.type}
                member={modalState.data}
                clan={clan}
                onActionSuccess={fetchData}
            />
        </div>
    );
}

export default ClanDetailPage;
