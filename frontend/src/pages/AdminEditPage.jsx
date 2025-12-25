import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useBreadcrumbs } from '../context/BreadcrumbsContext';
import toast from 'react-hot-toast';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";


import LazyTiptapEditor from '../components/LazyTiptapEditor';

function AdminEditPage() {
    const { pageId } = useParams();
    const navigate = useNavigate();
    const { authToken } = useAuth();
    const { setBreadcrumbs } = useBreadcrumbs();
    const isCreating = !pageId;

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        slug: '',
        is_published: false,
        category_id: null
    });
    const [categories, setCategories] = useState([]);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleContentChange = (newContent) => {
        setFormData(prev => ({ ...prev, content: newContent }));
    };
    const handleCategoryChange = (value) => {
        setFormData(prev => ({ ...prev, category_id: value === 'null' ? null : Number(value) }));
    };
    const handlePublishChange = (checked) => {
        setFormData(prev => ({ ...prev, is_published: checked }));
    };

    useEffect(() => {
        const fetchPageData = async () => {
            if (!authToken) return;

            try {
                const requests = [
                    axios.get('/api/admin/page-categories', { headers: { Authorization: `Bearer ${authToken}` } })
                ];

                if (pageId) {
                    requests.push(axios.get(`/api/admin/pages/${pageId}`, { headers: { Authorization: `Bearer ${authToken}` } }));
                }

                const [categoriesRes, pageRes] = await Promise.all(requests);

                setCategories(categoriesRes.data);

                if (pageId && pageRes) {
                    const page = pageRes.data;
                    setFormData({
                        title: page.title,
                        content: page.content,
                        slug: page.slug,
                        is_published: page.is_published,
                        category_id: page.category_id
                    });
                     setBreadcrumbs([
                        { label: 'Admin Panel' },
                        { label: 'Pages', link: '/admin/pages' },
                        { label: `Edit: ${page.title}` }
                    ]);
                } else {
                     setBreadcrumbs([
                        { label: 'Admin Panel' },
                        { label: 'Pages', link: '/admin/pages' },
                        { label: 'Create' }
                    ]);
                }
            } catch (err) {
                setError('Failed to load page data.');
            } finally {
                setLoading(false);
            }
        };

        fetchPageData();
        return () => setBreadcrumbs([]);
    }, [pageId, authToken, setBreadcrumbs]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSaving(true);
        setError('');

        const payload = { ...formData };

        try {
            const apiCall = isCreating
                ? axios.post('/api/admin/pages', payload, { headers: { Authorization: `Bearer ${authToken}` } })
                : axios.patch(`/api/admin/pages/${pageId}`, payload, { headers: { Authorization: `Bearer ${authToken}` } });

            await apiCall;
            toast.success(`Page ${isCreating ? 'created' : 'updated'} successfully!`);
            navigate('/admin/pages');
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isCreating ? 'create' : 'update'} page.`);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="h-10 w-10 animate-spin" /></div>;

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-sans text-3xl font-bold">{isCreating ? 'Create Page' : 'Edit Page'}</h1>
                    <p className="text-muted-foreground mt-1">
                        {isCreating ? 'Create a new custom page for the website.' : 'Edit the content of the existing page.'}
                    </p>
                </div>
                <Button type="submit" disabled={isSaving} size="lg" className="shrink-0">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    {isCreating ? 'Create Page' : 'Save Changes'}
                </Button>
            </div>

            {error && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-lg font-medium">Title</Label>
                    <Input id="title" name="title" value={formData.title} onChange={handleChange} disabled={isSaving} required className="text-lg h-12" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="slug">URL Slug</Label>
                        <Input id="slug" name="slug" value={formData.slug || ''} onChange={handleChange} disabled={isSaving || isCreating} />
                            {isCreating && <p className="text-xs text-muted-foreground">Slug will be auto-generated from the title on save.</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category_id">Category</Label>
                            <Select value={formData.category_id ? String(formData.category_id) : 'null'} onValueChange={handleCategoryChange} disabled={isSaving}>
                            <SelectTrigger id="category_id">
                                <SelectValue placeholder="— No Category —" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="null">— No Category —</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="publish-switch" className="text-base">Publish Page</Label>
                        <p className="text-sm text-muted-foreground">
                            Make this page accessible to the public.
                        </p>
                    </div>
                    <Switch id="publish-switch" checked={formData.is_published} onCheckedChange={handlePublishChange} disabled={isSaving} />
                </div>

                <div className="space-y-2">
                    <Label className="text-lg font-medium">Content</Label>
                    <LazyTiptapEditor content={formData.content} onChange={handleContentChange} />
                </div>
            </div>
        </form>
    );
}

export default AdminEditPage;