

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';


import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


import { UserPlus, MessageSquare, UserCheck, UserX, Clock, Loader2, Terminal, MoreVertical, ShieldAlert, Ban, User } from 'lucide-react';


import UserPostsList from '../components/UserPostsList';
import UserProfileSidebar from '../components/UserProfileSidebar';
import VerifiedIcons from '../components/VerifiedIcons';
import { constructImageUrl } from '../utils/url';

const AdminActionsModal = ({ isOpen, onClose, adminData, onBanClick }) => {
    if (!adminData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-yellow-500">Admin Information: {adminData.username}</DialogTitle>
                    <DialogDescription>This panel is visible only to moderators and admins.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="destructive" onClick={onBanClick}>
                        <Ban className="mr-2 h-4 w-4" /> Ban User
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const BanUserModal = ({ isOpen, onClose, user, onConfirm, loading }) => {
    const { authToken } = useAuth();
    const [banReasons, setBanReasons] = useState([]);
    const [formData, setFormData] = useState({ reason: '', customReason: '', duration_hours: '' });

    useEffect(() => {
        if (isOpen) {
            const fetchBanReasons = async () => {
                try {
                    const response = await axios.get('/api/admin/ban-reasons', { headers: { Authorization: `Bearer ${authToken}` } });
                    setBanReasons(response.data);
                } catch (err) {
                    toast.error("Could not load ban reasons.");
                }
            };
            fetchBanReasons();
            setFormData({ reason: '', customReason: '', duration_hours: '' });
        }
    }, [isOpen, authToken]);

    const handleConfirm = () => {
        const finalReason = formData.reason === 'custom' ? formData.customReason : formData.reason;
        if (!finalReason) {
            toast.error("A reason for the ban is required.");
            return;
        }
        const payload = {
            reason: finalReason,
            duration_hours: formData.duration_hours ? Number(formData.duration_hours) : undefined,
        };
        onConfirm(payload);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ban User: {user?.username}</DialogTitle>
                    <DialogDescription>Select a reason and optional duration for the ban.</DialogDescription>
                </DialogHeader>
                 <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Reason</Label>
                        <Select value={formData.reason} onValueChange={(val) => setFormData(p => ({ ...p, reason: val }))}>
                            <SelectTrigger><SelectValue placeholder="Select a preset reason..." /></SelectTrigger>
                            <SelectContent>
                                {banReasons.map(r => <SelectItem key={r.id} value={r.reason}>{r.reason}</SelectItem>)}
                                <SelectItem value="custom">-- Custom Reason --</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {formData.reason === 'custom' && (
                        <div className="space-y-2">
                            <Label>Custom Reason</Label>
                            <Textarea value={formData.customReason} onChange={(e) => setFormData(p => ({ ...p, customReason: e.target.value }))} />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Duration (in hours)</Label>
                        <Input type="number" placeholder="Leave empty for permanent" value={formData.duration_hours} onChange={(e) => setFormData(p => ({ ...p, duration_hours: e.target.value }))} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Ban
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

function PublicProfilePage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { isLoggedIn, user: currentUser, authToken } = useAuth();
    const { setBreadcrumbs } = useBreadcrumbs();
    const [profile, setProfile] = useState(null);
    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [friendship, setFriendship] = useState({ status: 'loading' });
    const [followStatus, setFollowStatus] = useState('loading');
    const [isActionLoading, setIsActionLoading] = useState(false);

    const [isAdminActionsOpen, setIsAdminActionsOpen] = useState(false);
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);

    const fetchProfile = useCallback(async () => {
        if (currentUser === undefined) return;
        setLoading(true);
        setError(null);
        try {
            const identifier = isNaN(parseInt(userId, 10)) ? userId : parseInt(userId, 10);

            if (currentUser && (currentUser.id === identifier || currentUser.profile_slug === identifier)) {
                navigate('/profile/me');
                return;
            }

            const profileResponse = await axios.get(`/api/users/${identifier}`);
            const fetchedProfile = profileResponse.data;
            setProfile(fetchedProfile);

            const config = { headers: { Authorization: `Bearer ${authToken}` } };

            if (isLoggedIn && currentUser && currentUser.rank?.power_level >= 800) {
                 const adminDetailsRes = await axios.get(`/api/admin/users/${fetchedProfile.id}/details`, config);
                 setAdminData(adminDetailsRes.data);
            }

            if (isLoggedIn && currentUser) {
                const statusResponse = await axios.get(`/api/friendships/status/${fetchedProfile.id}`, config);
                setFriendship(statusResponse.data);

                try {
                    const followStatusResponse = await axios.get(`/api/users/${fetchedProfile.id}/follow-status`, config);
                    setFollowStatus(followStatusResponse.data.following ? 'following' : 'not_following');
                } catch (followError) {
                    console.error('Failed to fetch follow status:', followError);
                    setFollowStatus('not_following');
                }

            } else {
                setFriendship({ status: 'guest' });
                setFollowStatus('guest');
            }
        } catch (err) {
            setError('Failed to load user profile. The user may not exist.');
        } finally {
            setLoading(false);
        }
    }, [userId, currentUser, isLoggedIn, authToken, navigate]);

     useEffect(() => {
        if (profile) {
            setBreadcrumbs([
                { label: 'Community', link: '/players' },
                { label: 'Players', link: '/players' },
                { label: profile.username }
            ]);
        }
        return () => setBreadcrumbs([]);
    }, [profile, setBreadcrumbs]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleFriendshipAction = async (action) => {
        if (!isLoggedIn) return;
        setIsActionLoading(true);
        const config = { headers: { Authorization: `Bearer ${authToken}` } };
        let endpoint = '';
        let method = 'post';
        let payload = {};

        switch (action) {
            case 'add': endpoint = '/api/friendships/requests'; payload = { receiverId: profile.id }; break;
            case 'accept': endpoint = `/api/friendships/requests/${friendship.requestId}/accept`; method = 'patch'; break;
            case 'reject': case 'cancel': endpoint = `/api/friendships/requests/${friendship.requestId}`; method = 'delete'; break;
            case 'remove': endpoint = `/api/friendships/${friendship.friendshipId}`; method = 'delete'; break;
            default: setIsActionLoading(false); return;
        }

        try {
            await axios[method](endpoint, method === 'patch' || method === 'post' ? payload : config, config);
            toast.success('Action successful!');
            fetchProfile();
        } catch (err) {
            toast.error(err.response?.data?.message || 'An error occurred.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleFollowAction = async () => {
        if (!isLoggedIn) return;
        setIsActionLoading(true);
        const config = { headers: { Authorization: `Bearer ${authToken}` } };
        const isFollowing = followStatus === 'following';
        const method = isFollowing ? 'delete' : 'post';
        const endpoint = `/api/users/${profile.id}/follow`;

        try {
            await axios[method](endpoint, method === 'post' ? {} : config, config);
            toast.success(isFollowing ? 'You have unfollowed this user.' : 'You are now following this user!');
            fetchProfile();
        } catch (err) {
            toast.error(err.response?.data?.message || 'An error occurred.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleBanUser = async (payload) => {
        if (!profile) return;
        setIsActionLoading(true);
        try {
            await axios.post(`/api/admin/users/${profile.id}/ban`, payload, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success(`${profile.username} has been banned.`);
            setIsBanModalOpen(false);
            fetchProfile();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to ban user.');
        } finally {
            setIsActionLoading(false);
        }
    };


    if (loading) return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive" className="mt-4"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    if (!profile) return null;

    const renderFriendshipButton = () => {
        if (!isLoggedIn || friendship.status === 'guest' || friendship.status === 'loading') return null;

        switch (friendship.status) {
            case 'ACCEPTED':
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" disabled={isActionLoading}><UserCheck className="mr-2 h-4 w-4" /> Friends</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleFriendshipAction('remove')} className="text-red-500 focus:text-red-500">
                                <UserX className="mr-2 h-4 w-4" /> Remove Friend
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            case 'PENDING_INCOMING':
                return (
                    <div className="flex gap-2">
                        <Button onClick={() => handleFriendshipAction('accept')} disabled={isActionLoading}><UserPlus className="mr-2 h-4 w-4" /> Accept</Button>
                        <Button variant="outline" onClick={() => handleFriendshipAction('reject')} disabled={isActionLoading}><UserX className="mr-2 h-4 w-4" />Decline</Button>
                    </div>
                );
            case 'PENDING_OUTGOING':
                return <Button variant="secondary" onClick={() => handleFriendshipAction('cancel')} disabled={isActionLoading}><Clock className="mr-2 h-4 w-4" /> Request Sent</Button>;
            default:
                return <Button onClick={() => handleFriendshipAction('add')} disabled={isActionLoading}><UserPlus className="mr-2 h-4 w-4" /> Add Friend</Button>;
        }
    };

    const renderActionButtons = () => (
      <>
        {adminData && (
            <Button variant="outline" onClick={() => setIsAdminActionsOpen(true)}>
                <ShieldAlert className="mr-2 h-4 w-4" /> Admin
            </Button>
        )}
        {isLoggedIn && followStatus !== 'guest' && (
          <Button
            onClick={handleFollowAction}
            disabled={isActionLoading || followStatus === 'loading'}
            variant={followStatus === 'following' ? 'secondary' : 'default'}
          >
            {followStatus === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {followStatus === 'following' && <UserCheck className="mr-2 h-4 w-4" />}
            {followStatus === 'not_following' && <UserPlus className="mr-2 h-4 w-4" />}
            {followStatus === 'following' ? 'Following' : 'Follow'}
          </Button>
        )}
        {renderFriendshipButton()}
        {friendship.status === 'ACCEPTED' && (
          <Button asChild variant="outline">
            <RouterLink to={`/messages/${profile.id}`}>
              <MessageSquare className="mr-2 h-4 w-4" /> Message
            </RouterLink>
          </Button>
        )}
      </>
    );

    return (
        <>
            <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
                <div className="md:w-[320px] md:shrink-0 h-full overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary">
                        <UserProfileSidebar user={profile}>
                            <div className="flex flex-wrap justify-center gap-2">
                                {renderActionButtons()}
                            </div>
                        </UserProfileSidebar>
                    </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-4 h-full overflow-hidden">
                    <h2 className="font-sans text-2xl font-bold shrink-0">Posts by {profile.username}</h2>

                    <div className="flex-1 min-h-0 overflow-hidden">
                        {!loading && <UserPostsList userId={profile.id} />}
                    </div>
                </div>
            </div>

            <AdminActionsModal
                isOpen={isAdminActionsOpen}
                onClose={() => setIsAdminActionsOpen(false)}
                adminData={adminData}
                onBanClick={() => {
                    setIsAdminActionsOpen(false);
                    setIsBanModalOpen(true);
                }}
            />

            <BanUserModal
                isOpen={isBanModalOpen}
                onClose={() => setIsBanModalOpen(false)}
                user={profile}
                onConfirm={handleBanUser}
                loading={isActionLoading}
            />
        </>
    );
}

export default PublicProfilePage;