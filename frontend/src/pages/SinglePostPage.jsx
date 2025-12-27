

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';
import { MoreVertical, Edit, Trash2, ShieldAlert, Loader2, Terminal, ArrowLeft, Send, User, Ban, Flag } from 'lucide-react';
import toast from 'react-hot-toast';

import VoteButtons from '../components/VoteButtons';
import { constructImageUrl } from '../utils/url';
import VerifiedIcons from '../components/VerifiedIcons';
import Comment from '../components/Comment';
import RenderedHtmlContent from '../components/RenderedHtmlContent';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import ConfirmationModal from '../components/ConfirmationModal';
import ReportModal from '../components/ReportModal';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const BanUserModal = ({ isOpen, onClose, user, onConfirm, loading }) => {
    const { authToken } = useAuth();
    const [banReasons, setBanReasons] = useState([]);
    const [formData, setFormData] = useState({ reason: '', customReason: '', duration_hours: '' });

    const handleFormChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

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
            <DialogContent
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle>Ban User: {user?.username}</DialogTitle>
                    <DialogDescription>Select a reason and optional duration for the ban.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Reason</Label>
                        <Select value={formData.reason} onValueChange={(val) => handleFormChange('reason', val)}>
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
                            <Textarea value={formData.customReason} onChange={(e) => handleFormChange('customReason', e.target.value)} />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Duration (in hours)</Label>
                        <Input type="number" placeholder="Leave empty for permanent" value={formData.duration_hours} onChange={(e) => handleFormChange('duration_hours', e.target.value)} />
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

const StickyPostHeader = ({ post }) => (
    <div className="flex items-center justify-between px-6 py-3 bg-black">
        <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border">
                <AvatarImage src={constructImageUrl(post.author?.pfp_url)} />
                <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <p className="text-sm font-bold line-clamp-1">{post.title}</p>
                <p className="text-xs text-muted-foreground">by {post.author?.username || 'Anonymous'}</p>
            </div>
        </div>
    </div>
);

function SinglePostPage() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { isLoggedIn, user: currentUser, authToken } = useAuth();
    const { setBreadcrumbs } = useBreadcrumbs();

    const { scrollRef, setStickyHeader } = useOutletContext();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newCommentContent, setNewCommentContent] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    useEffect(() => {
        if (!scrollRef?.current || !post) return;

        let isHeaderVisible = false;

        const handleScroll = () => {
            const scrollTop = scrollRef.current.scrollTop;
            const shouldShow = scrollTop > 200;

            if (shouldShow !== isHeaderVisible) {
                isHeaderVisible = shouldShow;
                setStickyHeader(shouldShow ? <StickyPostHeader post={post} /> : null);
            }
        };

        const container = scrollRef.current;
        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScroll);
            setStickyHeader(null);
        };
    }, [scrollRef, post, setStickyHeader]);

    const fetchPost = useCallback(async () => {
        try {
            setError(null);
            const config = authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {};
            const response = await axios.get(`/api/posts/${postId}`, config);
            setPost(response.data);
        } catch (err) {
            setError('Failed to load post. It may have been deleted or the link is incorrect.');
        } finally {
            setLoading(false);
        }
    }, [postId, authToken]);

    useEffect(() => {
        setLoading(true);
        fetchPost();
    }, [fetchPost]);

    useEffect(() => {
        if (!loading && window.location.hash === '#comments') {
            const element = document.getElementById('comments-section');
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }, [loading]);

    useEffect(() => {
        if (post) {
            setBreadcrumbs([
                { label: 'Community', link: '/posts' },
                { label: 'Posts', link: '/posts' },
                { label: post.title }
            ]);
        }
        return () => setBreadcrumbs([]);
    }, [post, setBreadcrumbs]);


    const handleVote = useCallback(async (targetType, targetId, value) => {
        if (!isLoggedIn) { toast.error('Please log in to vote.'); return; }
        try {
            await axios.post(`/api/votes/${targetType}s/${targetId}`, { value }, { headers: { Authorization: `Bearer ${authToken}` } });
            fetchPost();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to vote.');
            fetchPost();
        }
    }, [isLoggedIn, authToken, fetchPost]);

    const handleCommentSubmit = async (event) => {
        event.preventDefault();
        if (!newCommentContent.trim()) return;

        setIsSubmittingComment(true);
        try {
            await axios.post(
                `/api/posts/${postId}/comments`,
                { content: newCommentContent },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            setNewCommentContent('');
            fetchPost();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit comment.');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleDeletePost = async () => {
        setIsActionLoading(true);
        try {
            await axios.delete(`/api/posts/${postId}`, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success('Post deleted successfully.');
            navigate('/posts');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete post.');
        } finally {
            setIsActionLoading(false);
            setIsDeleteModalOpen(false);
        }
    };

    const handleBanUser = async (payload) => {
        if (!post?.author) return;
        setIsActionLoading(true);
        try {
            await axios.post(`/api/admin/users/${post.author.id}/ban`, payload, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success(`${post.author.username} has been banned.`);
            setIsBanModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to ban user.');
        } finally {
            setIsActionLoading(false);
        }
    };

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
    if (!post) return null;

    const canManagePost = isLoggedIn && (currentUser?.id === post.author?.id || currentUser?.rank?.power_level >= 800);
    const isAdmin = isLoggedIn && currentUser?.rank?.power_level >= 800;

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <Button variant="ghost" onClick={() => navigate('/posts')} className="pl-0">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to All Posts
                    </Button>
                    {isAdmin && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline"><ShieldAlert className="mr-2 h-4 w-4" /> Admin Actions</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsReportModalOpen(true)}><Flag className="mr-2 h-4 w-4" />Report Post</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsDeleteModalOpen(true)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete Post</DropdownMenuItem>
                                {post.author && (
                                    <DropdownMenuItem onClick={() => setIsBanModalOpen(true)} className="text-destructive focus:text-destructive"><Ban className="mr-2 h-4 w-4" />Ban Author</DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <div>
                    <div className="flex items-center gap-4">
                        <RouterLink to={`/users/${post.author?.profile_slug || post.author?.id}`}>
                            <Avatar>
                                <AvatarImage src={constructImageUrl(post.author?.pfp_url)} />
                                <AvatarFallback>
                                    <User className="h-[60%] w-[60%]" />
                                </AvatarFallback>
                            </Avatar>
                        </RouterLink>
                        <div className="grid gap-1">
                            <div className="flex items-center gap-2 text-sm font-semibold leading-none">
                                {post.author?.username || 'Anonymous'}
                                <VerifiedIcons user={post.author} />
                            </div>
                            <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleString()}</p>
                        </div>
                        {isLoggedIn && !canManagePost && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="ml-auto h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setIsReportModalOpen(true)}><Flag className="mr-2 h-4 w-4" />Report</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        {canManagePost && !isAdmin && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="ml-auto h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => navigate(`/posts/${post.id}/edit`)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setIsDeleteModalOpen(true)} className="text-red-500 focus:text-red-500"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    <h1 className="font-sans mt-4 text-4xl font-bold break-words">{post.title}</h1>
                    <Separator className="my-4" />
                    <RenderedHtmlContent htmlContent={post.content} />
                    <Separator className="my-4" />

                    <div className="flex items-center">
                        <VoteButtons initialScore={post.score} currentUserVote={post.currentUserVote} onVote={(value) => handleVote('post', post.id, value)} disabled={!isLoggedIn} />
                    </div>
                </div>

                <div id="comments-section" className="space-y-4">
                    <h2 className="font-sans text-2xl font-bold">Comments ({post.comments?.length || 0})</h2>

                    {isLoggedIn ? (
                        <form onSubmit={handleCommentSubmit} className="space-y-2">
                            <Textarea
                                placeholder="Write a comment..."
                                value={newCommentContent}
                                onChange={(e) => setNewCommentContent(e.target.value)}
                                rows={3}
                            />
                            <Button type="submit" disabled={isSubmittingComment}>
                                {isSubmittingComment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Post Comment
                            </Button>
                        </form>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            <RouterLink to="/login" className="underline">Log in</RouterLink> to leave a comment.
                        </p>
                    )}

                    <div className="space-y-6">
                        {(post.comments || []).map(comment => (
                            <Comment
                                key={comment.id}
                                comment={comment}
                                onCommentAction={fetchPost}
                                onVote={handleVote}
                                postData={post}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                open={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeletePost}
                title="Confirm Post Deletion"
                content={`Are you sure you want to permanently delete this post? This action cannot be undone.`}
                confirmText="Delete"
                confirmColor="destructive"
                loading={isActionLoading}
            />

            <BanUserModal
                isOpen={isBanModalOpen}
                onClose={() => setIsBanModalOpen(false)}
                user={post.author}
                onConfirm={handleBanUser}
                loading={isActionLoading}
            />

            {post && (
                <ReportModal
                    open={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    type="POST"
                    targetId={post.id}
                    targetName={post.title}
                    entityData={{
                        title: post.title,
                        content: post.content,
                        author: post.author,
                    }}
                />
            )}
        </>
    );
}

export default SinglePostPage;