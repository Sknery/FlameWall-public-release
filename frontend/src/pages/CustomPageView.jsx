import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, Terminal } from 'lucide-react';
import RenderedHtmlContent from '../components/RenderedHtmlContent';

function CustomPageView() {
    const { slug } = useParams();
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        axios.get(`/api/p/${slug}`)
            .then(response => {
                setPage(response.data);
                document.title = `${response.data.title} - FlameWall`;
            })
            .catch(() => {
                setError('Page not found.');
            })
            .finally(() => {
                setLoading(false);
            });
        return () => { document.title = 'FlameWall'; };
    }, [slug]);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive" className="mt-4"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    if (!page) return null;

    return (
        <div className="space-y-4">
            <h1 className="font-sans text-4xl font-bold">{page.title}</h1>
            <Separator />
            <RenderedHtmlContent htmlContent={page.content} />
        </div>
    );
}

export default CustomPageView;
