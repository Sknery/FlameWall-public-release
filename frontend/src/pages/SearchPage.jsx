

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';


import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, Search, Users, Newspaper, User } from 'lucide-react';


import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { constructImageUrl } from '../utils/url';
import VerifiedIcons from '../components/VerifiedIcons';
import { listContainer, fadeInUp } from '../utils/animations';

function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setBreadcrumbs } = useBreadcrumbs();

    const [inputValue, setInputValue] = useState(searchParams.get('query') || '');

    const [results, setResults] = useState({ users: [], posts: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        setBreadcrumbs([{ label: 'Search' }]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    const performSearch = useCallback(async (query) => {
        if (!query || query.trim() === '') {
            setResults({ users: [], posts: [] });
            setLoading(false);
            setHasSearched(true);
            return;
        }

        setLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            const [usersRes, postsRes] = await Promise.all([
                axios.get(`/api/users`, { params: { search: query, limit: 8 } }),
                axios.get(`/api/posts`, { params: { search: query, limit: 8 } })
            ]);
            setResults({ users: usersRes.data.data, posts: postsRes.data.data });
        } catch (err) {
            setError('Failed to fetch search results.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const initialQuery = searchParams.get('query');
        if (initialQuery) {
            performSearch(initialQuery);
        }
    }, [performSearch]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSearchParams({ query: inputValue });
        performSearch(inputValue);
    };

    const noResults = hasSearched && results.users.length === 0 && results.posts.length === 0;

    return (
        <div className="space-y-6">
            <h1 className="font-sans text-3xl font-bold">Search</h1>

            <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <Input
                    placeholder="Search for players, posts..."
                    className="flex-1"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    <span className="ml-2 hidden sm:inline">Search</span>
                </Button>
            </form>

            {error && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
            ) : noResults ? (
                <p className="text-muted-foreground text-center py-8">No results found for "{searchParams.get('query')}".</p>
            ) : hasSearched && (
                <motion.div variants={listContainer} initial="initial" animate="animate" className="space-y-8">
                    {results.users.length > 0 && (
                        <motion.section variants={fadeInUp}>
                            <h2 className="font-sans text-2xl font-bold mb-4 flex items-center gap-2"><Users /> Players</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {results.users.map(user => (
                                    <RouterLink key={user.id} to={`/users/${user.profile_slug || user.id}`}>
                                        <Card className="h-full text-center hover:bg-accent transition-colors">
                                            <CardContent className="p-4 flex flex-col items-center">
                                                <Avatar className="h-16 w-16 mb-2"><AvatarImage src={constructImageUrl(user.pfp_url)} /><AvatarFallback>
                                                    <User className="h-[60%] w-[60%]" />
                                                </AvatarFallback></Avatar>
                                                <p className="font-semibold flex items-center gap-1">{user.username}<VerifiedIcons user={user} /></p>
                                                <p className="text-xs font-semibold" style={{ color: user.rank?.display_color }}>{user.rank?.name}</p>
                                            </CardContent>
                                        </Card>
                                    </RouterLink>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {results.posts.length > 0 && (
                        <motion.section variants={fadeInUp}>
                            <h2 className="font-sans text-2xl font-bold mb-4 flex items-center gap-2"><Newspaper /> Posts</h2>
                            <Card>
                                {results.posts.map((post, index) => (
                                    <React.Fragment key={post.id}>
                                        <div className="p-4 hover:bg-accent transition-colors rounded-md">
                                            <RouterLink to={`/posts/${post.id}`}>
                                                <p className="font-semibold">{post.title}</p>
                                                <p className="text-xs text-muted-foreground">by {post.author?.username || '[deleted]'} on {new Date(post.created_at).toLocaleDateString()}</p>
                                            </RouterLink>
                                        </div>
                                        {index < results.posts.length - 1 && <Separator />}
                                    </React.Fragment>
                                ))}
                            </Card>
                        </motion.section>
                    )}
                </motion.div>
            )}
        </div>
    );
}

export default SearchPage;
