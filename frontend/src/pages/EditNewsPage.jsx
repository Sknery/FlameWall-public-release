import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import LazyTiptapEditor from '../components/LazyTiptapEditor';
import { Loader2, Terminal, Save } from 'lucide-react';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';

function EditNewsPage() {
    const { newsId } = useParams();
    const navigate = useNavigate();
    const { authToken } = useAuth();
    const { setBreadcrumbs } = useBreadcrumbs();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [originalTitle, setOriginalTitle] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await axios.get(`/api/news/${newsId}`, { headers: { Authorization: `Bearer ${authToken}` } });
                const { name, desc } = response.data;
                setTitle(name);
                setContent(desc);
                setOriginalTitle(name);
                setBreadcrumbs([
                    { label: 'News', link: '/news' },
                    { label: name, link: `/news/${newsId}` },
                    { label: 'Edit' }
                ]);
            } catch (err) {
                setError('Failed to load news data.');
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
        return () => setBreadcrumbs([]);
    }, [newsId, authToken, setBreadcrumbs]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSaving(true);
        setError('');
        try {
            await axios.patch(`/api/news/${newsId}`, { name: title, desc: content }, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success('News article updated successfully!');
            navigate('/news');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update news article.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <form onSubmit={handleSubmit} className="w-full mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-sans text-3xl font-bold">Edit Article</h1>
                    <p className="text-muted-foreground mt-1">Editing: <span className="font-medium text-foreground">{originalTitle}</span></p>
                </div>
                <Button type="submit" disabled={isSaving} size="lg" className="shrink-0">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                </Button>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-lg font-medium">Title</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="text-lg h-12"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-lg font-medium">Content</Label>
                    <LazyTiptapEditor content={content} onChange={setContent} />
                </div>
            </div>
        </form>
    );
}

export default EditNewsPage;