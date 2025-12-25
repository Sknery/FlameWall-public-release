import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, Terminal, MessageSquare, ThumbsUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import VoteButtons from './VoteButtons';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const SimplePagination = ({ count, page, onChange, disabled }) => {
    if (count <= 1) return null;

    return (
        <div className="flex items-center justify-between py-3 px-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
            <Button
                variant="outline"
                size="sm"
                disabled={page === 1 || disabled}
                onClick={(e) => onChange(e, page - 1)}
                className="h-8"
            >
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <span className="text-xs font-medium text-muted-foreground">
                Page {page} of {count}
            </span>
            <Button
                variant="outline"
                size="sm"
                disabled={page === count || disabled}
                onClick={(e) => onChange(e, page + 1)}
                className="h-8"
            >
                Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
        </div>
    );
};

const PostPreview = ({ htmlContent }) => {
    const textContent = (() => {
        try {
            const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
            return doc.body.textContent || "";
        } catch (e) { return ''; }
    })();
    return (
        <p className="mb-3 text-sm text-muted-foreground line-clamp-3 leading-relaxed break-all">
            {textContent.trim() || "No content preview available."}
        </p>
    );
};

const UserPostsList = forwardRef(({ userId }, ref) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isLoggedIn, authToken } = useAuth();
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const LIMIT = 10;

    const fetchPosts = useCallback(async (currentPage) => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const config = {
                headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
                params: { page: currentPage, limit: LIMIT }
            };
            const response = await axios.get(`/api/users/${userId}/posts`, config);
            setPosts(response.data.data);
            setTotalPages(Math.ceil(response.data.total / LIMIT));
        } catch (err) {
            setError('Failed to load posts.');
        } finally {
            setLoading(false);
        }
    }, [userId, authToken]);

    useEffect(() => {
        fetchPosts(page);
    }, [page, fetchPosts]);

    const handleVote = useCallback(async (postId, value) => {
        if (!isLoggedIn) {
            toast.error('Please log in to vote.');
            return;
        }
        try {
            await axios.post(`/api/votes/posts/${postId}`, { value }, { headers: { Authorization: `Bearer ${authToken}` } });
            setPosts(currentPosts => currentPosts.map(p => {
                if (p.id === postId) {
                    return p;
                }
                return p;
            }));
            fetchPosts(page);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to vote.');
        }
    }, [isLoggedIn, authToken, fetchPosts, page]);


    if (error) {
        return <Alert variant="destructive" className="my-2"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    }

    return (
        <div className="flex flex-col h-full overflow-hidden relative">
            <div ref={ref} className="flex-1 overflow-y-auto p-1 pr-2 scrollbar-thin scrollbar-thumb-secondary">
                {loading && posts.length === 0 ? (
                     <div className="flex justify-center items-center h-full min-h-[200px]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" /></div>
                ) : posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground border-2 border-dashed border-border/40 rounded-xl p-8 bg-muted/5">
                        <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-sm font-medium">No posts yet</p>
                        <p className="text-xs text-muted-foreground/60">This user hasn't shared anything.</p>
                    </div>
                ) : (
                    <div className="responsive-grid-posts pb-4">
                        <AnimatePresence mode='wait'>
                            {posts.map((post, index) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    className="h-full"
                                >
                                    <Card className="overflow-hidden border-border/60 hover:border-primary/50 transition-all duration-200 hover:shadow-md bg-card/50 h-full flex flex-col">
                                        <CardContent className="p-5 flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-3">
                                                <RouterLink
                                                    to={`/posts/${post.id}`}
                                                    className="text-lg font-bold hover:text-primary transition-colors line-clamp-1 leading-tight break-all"
                                                >
                                                    {post.title}
                                                </RouterLink>
                                                <span className="text-[10px] font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full whitespace-nowrap ml-3">
                                                    {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>

                                            <RouterLink to={`/posts/${post.id}`} className="block group flex-1">
                                                <PostPreview htmlContent={post.content} />
                                            </RouterLink>

                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                                                <VoteButtons
                                                    initialScore={post.score}
                                                    currentUserVote={post.currentUserVote}
                                                    onVote={(value) => handleVote(post.id, value)}
                                                    disabled={!isLoggedIn}
                                                />

                                                <div className="flex items-center gap-4">
                                                     <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                                        <MessageSquare className="h-3.5 w-3.5" />
                                                        <span className="font-medium">{post.commentCount || 0}</span>
                                                    </div>
                                                    <Button variant="ghost" size="sm" asChild className="h-7 text-xs px-3 hover:bg-primary hover:text-primary-foreground transition-colors">
                                                        <RouterLink to={`/posts/${post.id}`}>
                                                            Read
                                                        </RouterLink>
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {}
            <div className="shrink-0 mt-auto z-10">
                <SimplePagination
                    count={totalPages}
                    page={page}
                    onChange={(event, value) => setPage(value)}
                    disabled={loading}
                />
            </div>
        </div>
    );
});

UserPostsList.displayName = "UserPostsList";

export default UserPostsList;