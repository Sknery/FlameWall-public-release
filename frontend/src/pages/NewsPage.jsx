

import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';


import { Plus, MoreVertical, Edit, Trash2, Loader2, Terminal, User, Calendar, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';


import ConfirmationModal from '@/components/ConfirmationModal';
import { constructImageUrl } from '@/utils/url';
import { listContainer, fadeInUp } from '@/utils/animations';

const NewsPreview = ({ htmlContent }) => {
    const createPreview = (html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    return (
        <p className="text-sm text-muted-foreground line-clamp-3 mt-2 break-all">
            {createPreview(htmlContent)}
        </p>
    );
};

function NewsPage() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user: currentUser, authToken } = useAuth();
    const navigate = useNavigate();

    const canManageNews = currentUser?.rank?.power_level >= 800;

    const [modalOpen, setModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const { setBreadcrumbs } = useBreadcrumbs();

    const fetchNews = useCallback(async () => {
        try {
            const response = await axios.get('/api/news');
            setNews(response.data);
        } catch (err) {
            setError('Failed to load news. The server might be down.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setBreadcrumbs([
            { label: 'News' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    const openDeleteModal = (article) => {
        setItemToDelete(article);
        setModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        setIsActionLoading(true);
        try {
            await axios.delete(`/api/news/${itemToDelete.id}`, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success('News article deleted.');
            fetchNews();
        } catch (err) {
            toast.error('Failed to delete article.');
        } finally {
            setIsActionLoading(false);
            setModalOpen(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="space-y-6 pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="font-sans text-3xl font-bold">Server News</h1>
                {canManageNews && (
                    <Button asChild>
                        <RouterLink to="/admin/news/create"><Plus className="mr-2 h-4 w-4" />Create News</RouterLink>
                    </Button>
                )}
            </div>

            {news.length > 0 ? (
                <motion.div
                    variants={listContainer}
                    initial="initial"
                    animate="animate"
                    className="responsive-grid-posts"
                >
                    {news.map((article) => (
                        <motion.div key={article.id} variants={fadeInUp} className="h-full w-full">
                            <Card className="h-full flex flex-col hover:border-primary/50 transition-colors group">
                                <CardHeader className="p-5 pb-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            <span>{new Date(article.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {canManageNews && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-6 w-6 p-0 -mr-2">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => navigate(`/admin/news/${article.id}/edit`)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openDeleteModal(article)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                    <RouterLink to={`/news/${article.id}`}>
                                        {}
                                        <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2 break-all">{article.name}</CardTitle>
                                    </RouterLink>
                                </CardHeader>

                                <CardContent className="p-5 pt-0 flex-1">
                                    <RouterLink to={`/news/${article.id}`}>
                                        <NewsPreview htmlContent={article.desc} />
                                    </RouterLink>
                                </CardContent>

                                <CardFooter className="p-5 pt-0 mt-auto">
                                    <div className="flex items-center justify-between w-full border-t pt-4">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={constructImageUrl(article.author?.pfp_url)} />
                                                <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs font-medium">{article.author?.username || 'System'}</span>
                                        </div>
                                        <Button variant="ghost" size="sm" asChild className="h-8 text-xs px-0 hover:bg-transparent hover:text-primary">
                                            <RouterLink to={`/news/${article.id}`}>
                                                Read More <ArrowRight className="ml-1 h-3 w-3" />
                                            </RouterLink>
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                    <p>No news articles found.</p>
                </div>
            )}
            <ConfirmationModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirm Deletion"
                content={`Are you sure you want to delete the article "${itemToDelete?.name}"?`}
                confirmText="Delete"
                confirmColor="destructive"
                loading={isActionLoading}
            />
        </div>
    );
}

export default NewsPage;