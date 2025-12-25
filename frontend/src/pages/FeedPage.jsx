
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { motion } from 'framer-motion';


import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2, Terminal, User, Rss, MessageSquare } from 'lucide-react';


import { constructImageUrl } from '../utils/url';
import { listContainer, fadeInUp } from '../utils/animations';
import VoteButtons from '../components/VoteButtons';

const PostPreview = ({ htmlContent }) => {
    const textContent = (() => {
        const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
        return doc.body.textContent || "";
    })();
    return (
        <p className="text-sm text-muted-foreground line-clamp-3">{textContent.trim()}</p>
    );
};

const FollowingBar = ({ following }) => (
    <div className="space-y-2">
        <h2 className="font-semibold text-lg">Following</h2>
        <ScrollArea className="w-full whitespace-nowrap rounded-md">
            <div className="flex w-max space-x-4 p-4">
                {following.map(user => (
                    <RouterLink to={`/users/${user.profile_slug || user.id}`} key={user.id} className="shrink-0">
                        <figure className="w-20 text-center">
                            <Avatar className="h-16 w-16 mx-auto border-2 border-transparent hover:border-primary transition-all">
                                <AvatarImage src={constructImageUrl(user.pfp_url)} />
                                <AvatarFallback><User className="h-8 w-8" /></AvatarFallback>
                            </Avatar>
                            <figcaption className="text-xs mt-2 truncate">{user.username}</figcaption>
                        </figure>
                    </RouterLink>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    </div>
);

function FeedPage() {
    const [posts, setPosts] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { authToken, isLoggedIn } = useAuth();
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

    useEffect(() => {
        setBreadcrumbs([
            { label: 'My Profile', link: '/profile/me' },
            { label: 'Feed' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    useEffect(() => {
        if (!authToken) return;
        setLoading(true);
        setError(null);

        const config = { headers: { Authorization: `Bearer ${authToken}` } };
        const requests = [
            axios.get('/api/users/feed', { ...config, params: { page, limit: 10 } })
        ];

        if (page === 1) {
            requests.push(axios.get('/api/users/following', config));
        }

        Promise.all(requests)
            .then(responses => {
                const postsResponse = responses[0];
                setHasMore(postsResponse.data.data.length > 0);
                if (page === 1) {
                    setPosts(postsResponse.data.data);
                } else {
                    setPosts(prev => [...prev, ...postsResponse.data.data]);
                }

                if (responses.length > 1) {
                    setFollowing(responses[1].data);
                }
            })
            .catch(err => {
                setError('Failed to load your feed.');
            })
            .finally(() => {
                setLoading(false);
            });

    }, [authToken, page]);

    const handleVote = useCallback(async (postId, value) => {
        if (!isLoggedIn) {
            return;
        }
        try {
            const response = await axios.post(`/api/votes/posts/${postId}`, { value }, { headers: { Authorization: `Bearer ${authToken}` } });
            setPosts(prevPosts => prevPosts.map(p =>
                p.id === postId ? { ...p, score: response.data.likes - response.data.dislikes, currentUserVote: value === p.currentUserVote ? 0 : value } : p
            ));
        } catch (error) {
           console.error("Vote failed");
        }
    }, [isLoggedIn, authToken]);

    if (error && page === 1) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="space-y-6">
            <h1 className="font-sans text-3xl font-bold flex items-center gap-3"><Rss /> Your Feed</h1>

            {following.length > 0 && <FollowingBar following={following} />}

            {posts.length > 0 ? (
                <motion.div variants={listContainer} initial="initial" animate="animate" className="responsive-grid-posts">
                    {posts.map((post, index) => (
                        <motion.div key={post.id} variants={fadeInUp} ref={posts.length === index + 1 ? lastPostElementRef : null} className="h-full w-full">
                            <Card className="h-full flex flex-col hover:border-primary/50 transition-colors">
                                <CardHeader className="flex flex-row items-center gap-4 p-4">
                                    <RouterLink to={`/users/${post.author?.profile_slug || post.author?.id}`}>
                                        <Avatar><AvatarImage src={constructImageUrl(post.author?.pfp_url)} /><AvatarFallback><User /></AvatarFallback></Avatar>
                                    </RouterLink>
                                    <div>
                                        <p className="text-sm font-semibold">{post.author?.username || 'Anonymous'}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                                    <RouterLink to={`/posts/${post.id}`} className="block group flex-1">
                                        <h2 className="font-sans text-xl font-bold group-hover:text-primary transition-colors line-clamp-2 mb-2">{post.title}</h2>
                                        <PostPreview htmlContent={post.content} />
                                    </RouterLink>
                                </CardContent>
                                <Separator />
                                <div className="p-4 flex items-center justify-between mt-auto">
                                    <VoteButtons initialScore={post.score} currentUserVote={post.currentUserVote} onVote={(value) => handleVote(post.id, value)} disabled={!isLoggedIn} />
                                    <Button variant="ghost" asChild>
                                        <RouterLink to={`/posts/${post.id}#comments`}>
                                            <MessageSquare className="mr-2 h-4 w-4" />
                                            {post.commentCount}
                                        </RouterLink>
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                !loading && <p className="text-muted-foreground text-center py-8">Your feed is empty. Find players to follow to see their posts here!</p>
            )}

            {loading && hasMore && <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>}
        </div>
    );
}

export default FeedPage;