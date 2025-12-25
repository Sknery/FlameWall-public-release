import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import toast from 'react-hot-toast';


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, Save } from 'lucide-react';


import LazyTiptapEditor from '../components/LazyTiptapEditor';

function CreatePostPage() {
    const navigate = useNavigate();
    const { authToken } = useAuth();
    const { setBreadcrumbs } = useBreadcrumbs();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setBreadcrumbs([
            { label: 'Community', link: '/posts' },
            { label: 'Posts', link: '/posts' },
            { label: 'Create' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(
                `/api/posts`,
                { title, content },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            toast.success('Post created successfully!');
            navigate(`/posts/${response.data.id}`);
        } catch (err) {
            const message = err.response?.data?.message;
            const errorMessage = Array.isArray(message) ? message.join(', ') : message;
            setError(errorMessage || 'Failed to create post.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full mx-auto space-y-8">
            {}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-sans text-3xl font-bold">Create Post</h1>
                    <p className="text-muted-foreground mt-1">Share your thoughts with the community.</p>
                </div>
                <Button type="submit" disabled={loading} size="lg" className="shrink-0">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Publish Post
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {}
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-lg font-medium">Title</Label>
                    <Input
                        id="title"
                        placeholder="Enter an interesting title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        disabled={loading}
                        className="text-lg h-12"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-lg font-medium">Content</Label>
                    <LazyTiptapEditor
                        content={content}
                        onChange={setContent}
                        disabled={loading}
                    />
                </div>
            </div>
        </form>
    );
}

export default CreatePostPage;