import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

function EditPostPage() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { authToken, user: currentUser } = useAuth();
    const { setBreadcrumbs } = useBreadcrumbs();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isForbidden, setIsForbidden] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const response = await axios.get(`/api/posts/${postId}`);
                const post = response.data;

                const isAdmin = currentUser && currentUser.rank?.power_level >= 800;
                const isAuthor = currentUser?.id === post.author?.id;

                if (!isAuthor && !isAdmin) {
                    setIsForbidden(true);
                    setError('You are not authorized to edit this post.');
                    return;
                }

                setTitle(post.title);
                setContent(post.content);
                setBreadcrumbs([
                    { label: 'Community', link: '/posts' },
                    { label: 'Posts', link: '/posts' },
                    { label: post.title, link: `/posts/${post.id}`},
                    { label: 'Edit' }
                ]);

            } catch (err) {
                setError('Failed to load post data.');
            } finally {
                setLoading(false);
            }
        };

        if (postId && currentUser) {
            fetchPost();
        }

        return () => setBreadcrumbs([]);
    }, [postId, currentUser, setBreadcrumbs]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSaving(true);
        setError('');
        try {
            await axios.patch(
                `/api/posts/${postId}`,
                { title, content },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            toast.success('Post updated successfully!');
            navigate(`/posts/${postId}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update post.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (isForbidden || error) return <Alert variant="destructive" className="mt-4"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <form onSubmit={handleSubmit} className="w-full mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-sans text-3xl font-bold">Edit Post</h1>
                    <p className="text-muted-foreground mt-1">Make changes to your publication.</p>
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
                        disabled={isSaving}
                        required
                        className="text-lg h-12"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-lg font-medium">Content</Label>
                    {}
                    <LazyTiptapEditor content={content} onChange={setContent} />
                </div>
            </div>
        </form>
    );
}

export default EditPostPage;