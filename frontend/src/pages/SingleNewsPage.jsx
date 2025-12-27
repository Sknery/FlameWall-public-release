import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink, useOutletContext } from 'react-router-dom';
import axios from 'axios';


import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';
import { Loader2, Terminal, ArrowLeft, User, Flag, MoreVertical } from 'lucide-react';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { useAuth } from '@/context/AuthContext';

import RenderedHtmlContent from '../components/RenderedHtmlContent';
import { constructImageUrl } from '../utils/url';
import VerifiedIcons from '../components/VerifiedIcons';
import ReportModal from '../components/ReportModal';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const StickyNewsHeader = ({ article }) => (
    <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
             <Avatar className="h-8 w-8 border">
                <AvatarImage src={constructImageUrl(article.author?.pfp_url)} />
                <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                 <p className="text-sm font-bold line-clamp-1">{article.name}</p>
                 <p className="text-xs text-muted-foreground">by {article.author?.username || 'System'}</p>
            </div>
        </div>
    </div>
);

function SingleNewsPage() {
    const { newsId } = useParams();
    const navigate = useNavigate();
    const { scrollRef, setStickyHeader } = useOutletContext();
    const { isLoggedIn } = useAuth();

    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const { setBreadcrumbs } = useBreadcrumbs();

    useEffect(() => {
        if (!scrollRef?.current || !article) return;

        let isHeaderVisible = false;

        const handleScroll = () => {
            const scrollTop = scrollRef.current.scrollTop;
            const shouldShow = scrollTop > 200;
            if (shouldShow !== isHeaderVisible) {
                isHeaderVisible = shouldShow;
                setStickyHeader(shouldShow ? <StickyNewsHeader article={article} /> : null);
            }
        };

        const container = scrollRef.current;
        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScroll);
            setStickyHeader(null);
        };
    }, [scrollRef, article, setStickyHeader]);

    useEffect(() => {
        if (article) {
            setBreadcrumbs([
                { label: 'News', link: '/news' },
                { label: article.name }
            ]);
        }
        return () => setBreadcrumbs([]);
    }, [article, setBreadcrumbs]);

    useEffect(() => {
        if (!newsId) return;
        const fetchArticle = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/news/${newsId}`);
                setArticle(response.data);
            } catch (err) {
                setError('Failed to load news article.');
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
    }, [newsId]);

    if (loading) return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    if (!article) return <p>Article not found.</p>;

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => navigate('/news')} className="pl-0">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All News
            </Button>

            <div>
                <div className="flex items-center gap-4">
                    <RouterLink to={`/users/${article.author?.profile_slug || article.author?.id}`}>
                        <Avatar>
                            <AvatarImage src={constructImageUrl(article.author?.pfp_url)} />
                            <AvatarFallback>
                                <User className="h-[60%] w-[60%]" />
                            </AvatarFallback>
                        </Avatar>
                    </RouterLink>
                    <div className="grid gap-1">
                        <div className="flex items-center gap-2 text-sm font-semibold leading-none">
                            {article.author?.username || 'System'}
                            <VerifiedIcons user={article.author} />
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(article.created_at).toLocaleString()}</p>
                    </div>
                    {isLoggedIn && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="ml-auto h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsReportModalOpen(true)}>
                                    <Flag className="mr-2 h-4 w-4" />Report
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <h1 className="font-sans mt-4 text-4xl font-bold">{article.name}</h1>
                <Separator className="my-4" />
                <RenderedHtmlContent htmlContent={article.desc} />
            </div>

            {article && (
                <ReportModal
                    open={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    type="NEWS"
                    targetId={article.id}
                    targetName={article.name}
                    entityData={{
                        name: article.name,
                        desc: article.desc,
                        author: article.author,
                    }}
                />
            )}
        </div>
    );
}

export default SingleNewsPage;