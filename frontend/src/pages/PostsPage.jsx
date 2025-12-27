

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';
import { Plus, MoreVertical, Edit, Trash2, Loader2, Terminal, User, MessageSquare, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

import VoteButtons from '../components/VoteButtons';
import { constructImageUrl } from '../utils/url';
import ConfirmationModal from '../components/ConfirmationModal';
import ReportModal from '../components/ReportModal';
import { listContainer, fadeInUp } from '../utils/animations';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';

const PostPreview = ({ htmlContent }) => {
    const imagePlaceholder = ' - 🖼️ - ';
    const contentWithPlaceholders = htmlContent.replace(/<img[^>]*>/g, imagePlaceholder);
    const textContent = (() => {
        try {
            const doc = new DOMParser().parseFromString(contentWithPlaceholders, 'text/html');
            return doc.body.textContent || "";
        } catch (e) { return ''; }
    })();
    return (
        <p className="text-sm text-muted-foreground line-clamp-3 mt-2 break-all">
            {textContent.trim()}
        </p>
    );
};

function PostsPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { isLoggedIn, authToken, user: currentUser } = useAuth();
    const navigate = useNavigate();
    const { setBreadcrumbs } = useBreadcrumbs();

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef();

    const lastPostElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);


    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', content: '', onConfirm: null });
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [selectedPostForReport, setSelectedPostForReport] = useState(null);

    useEffect(() => {
        setBreadcrumbs([
            { label: 'Community', link: '/posts' },
            { label: 'Posts' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    const isAdmin = currentUser && currentUser.rank?.power_level >= 800;

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const config = {
                headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
                params: { page, limit: 12 }
            };
            const response = await axios.get('/api/posts', config);
            setHasMore(response.data.data.length > 0);
            if (page === 1) {
                setPosts(response.data.data);
            } else {
                setPosts(prev => [...prev, ...response.data.data]);
            }
        } catch (err) {
            setError('Failed to load posts. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [authToken, page]);

    useEffect(() => {
        fetchPosts();

    }, [page]);

    const handleVote = useCallback(async (postId, value) => {
        if (!isLoggedIn) { toast.error('Please log in to vote.'); return; }
        try {
            const response = await axios.post(`/api/votes/posts/${postId}`, { value }, { headers: { Authorization: `Bearer ${authToken}` } });
            setPosts(prevPosts => prevPosts.map(p => p.id === postId ? {...p, score: response.data.likes - response.data.dislikes, currentUserVote: value === p.currentUserVote ? 0 : value } : p));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to vote.');
        }
    }, [isLoggedIn, authToken]);

    const openDeleteModal = (post) => {
        setModalContent({
            title: 'Confirm Post Deletion',
            content: `Are you sure you want to permanently delete the post "${post.title}"?`,
            confirmText: 'Delete',
            confirmColor: 'destructive',
            onConfirm: () => confirmDeletePost(post.id)
        });
        setModalOpen(true);
    };

    const confirmDeletePost = async (postId) => {
        setIsActionLoading(true);
        try {
            await axios.delete(`/api/posts/${postId}`, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success('Post deleted successfully.');
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete post.');
        } finally {
            setIsActionLoading(false);
            setModalOpen(false);
        }
    };

    if (error && page === 1) {
        return (
            <Alert variant="destructive" className="mt-4">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="font-sans text-3xl font-bold">Community Posts</h1>
                {isLoggedIn && (
                    <Button asChild>
                        <RouterLink to="/posts/new"><Plus className="mr-2 h-4 w-4" />Create Post</RouterLink>
                    </Button>
                )}
            </div>

            <motion.div
                variants={listContainer}
                initial="initial"
                animate="animate"
                className="responsive-grid-posts"
            >
                {posts.map((post, index) => {
                    const canManagePost = isLoggedIn && (currentUser?.id === post.author?.id || isAdmin);
                    const isLastElement = posts.length === index + 1;
                    return (
                        <motion.div
                            key={post.id}
                            variants={fadeInUp}
                            ref={isLastElement ? lastPostElementRef : null}
                            className="h-full w-full"
                        >
                            <Card className="h-full flex flex-col hover:border-primary/50 transition-colors">
                                <CardHeader className="flex flex-row items-start justify-between gap-2 p-4 pb-2">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <RouterLink to={`/users/${post.author?.profile_slug || post.author?.id}`} className="shrink-0">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={constructImageUrl(post.author?.pfp_url)} />
                                                <AvatarFallback>
                                                    <User className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                        </RouterLink>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">{post.author?.username || 'Anonymous'}</p>
                                            <p className="text-[10px] text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 shrink-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {canManagePost && (
                                                <>
                                                    <DropdownMenuItem onClick={() => navigate(`/posts/${post.id}/edit`)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openDeleteModal(post)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                                </>
                                            )}
                                            {!canManagePost && isLoggedIn && (
                                                <DropdownMenuItem onClick={() => {
                                                    setSelectedPostForReport(post);
                                                    setReportModalOpen(true);
                                                }}>
                                                    <Flag className="mr-2 h-4 w-4" />Report
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardHeader>

                                <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                                    <RouterLink to={`/posts/${post.id}`} className="block group flex-1">
                                        {}
                                        <h2 className="font-sans text-lg font-bold group-hover:text-primary transition-colors line-clamp-2 mb-1 break-all">{post.title}</h2>
                                        <PostPreview htmlContent={post.content} />
                                    </RouterLink>

                                    <Separator className="my-3" />

                                    <div className="flex items-center justify-between mt-auto">
                                        <VoteButtons initialScore={post.score} currentUserVote={post.currentUserVote} onVote={(value) => handleVote(post.id, value)} disabled={!isLoggedIn} />
                                        <Button variant="ghost" size="sm" asChild className="text-xs h-8">
                                            <RouterLink to={`/posts/${post.id}#comments`}>
                                                <MessageSquare className="mr-2 h-3.5 w-3.5" />
                                                {post.commentCount}
                                            </RouterLink>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </motion.div>

            {loading && hasMore && <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>}

            {!loading && posts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                     <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                     <p>No posts have been created yet.</p>
                </div>
            )}

            <ConfirmationModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={modalContent.onConfirm}
                title={modalContent.title}
                content={modalContent.content}
                confirmText={modalContent.confirmText}
                confirmColor={modalContent.confirmColor}
                loading={isActionLoading}
            />

            {selectedPostForReport && (
                <ReportModal
                    open={reportModalOpen}
                    onClose={() => {
                        setReportModalOpen(false);
                        setSelectedPostForReport(null);
                    }}
                    type="POST"
                    targetId={selectedPostForReport.id}
                    targetName={selectedPostForReport.title}
                    entityData={{
                        title: selectedPostForReport.title,
                        content: selectedPostForReport.content,
                        author: selectedPostForReport.author,
                    }}
                />
            )}

        </div>
    );
}

export default PostsPage;