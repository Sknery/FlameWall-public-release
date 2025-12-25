import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import LazyTiptapEditor from '../components/LazyTiptapEditor';
import { Loader2, Terminal, Save } from 'lucide-react';

function CreateNewsPage() {
    const navigate = useNavigate();
    const { authToken } = useAuth();
    const { setBreadcrumbs } = useBreadcrumbs();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setBreadcrumbs([
            { label: 'News', link: '/news' },
            { label: 'Create' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);


    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        if (!title.trim() || !content.trim()) {
            setError('Title and content cannot be empty.');
            setLoading(false);
            return;
        }

        try {
            await axios.post(
                '/api/news',
                { name: title, desc: content },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            navigate('/news');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create news article.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-sans text-3xl font-bold">Create Article</h1>
                    <p className="text-muted-foreground mt-1">Publish news for the entire server.</p>
                </div>
                <Button type="submit" disabled={loading} size="lg" className="shrink-0">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Publish Article
                </Button>
            </div>

            {error && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-lg font-medium">Title</Label>
                    <Input
                        id="title"
                        placeholder="Enter article title..."
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

export default CreateNewsPage;