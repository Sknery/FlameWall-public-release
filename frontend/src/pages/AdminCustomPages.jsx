import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, Plus, Edit, Trash2, FileText, Globe, EyeOff, ExternalLink } from 'lucide-react';


import ConfirmationModal from '../components/ConfirmationModal';
import { listContainer, fadeInUp } from '../utils/animations';

function AdminCustomPages() {
    const { authToken } = useAuth();
    const navigate = useNavigate();
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { setBreadcrumbs } = useBreadcrumbs();

    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [pageToDelete, setPageToDelete] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const fetchPages = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/admin/pages', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setPages(response.data);
        } catch (err) {
            setError('Failed to load pages.');
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        setBreadcrumbs([
            { label: 'Admin Panel' },
            { label: 'Pages' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    useEffect(() => {
        fetchPages();
    }, [fetchPages]);

    const handleOpenDeleteModal = (page) => {
        setPageToDelete(page);
        setConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!pageToDelete) return;
        setIsActionLoading(true);
        try {
            await axios.delete(`/api/admin/pages/${pageToDelete.id}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success(`Page "${pageToDelete.title}" deleted successfully.`);
            fetchPages();
        } catch (err) {
            toast.error('Failed to delete page.');
        } finally {
            setIsActionLoading(false);
            setConfirmModalOpen(false);
            setPageToDelete(null);
        }
    };

    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="font-sans text-3xl font-bold">Custom Pages</h1>
                <Button asChild>
                    <RouterLink to="/admin/pages/new">
                        <Plus className="mr-2 h-4 w-4" /> Create Page
                    </RouterLink>
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin" /></div>
            ) : pages.length > 0 ? (
                <motion.div
                    variants={listContainer}
                    initial="initial"
                    animate="animate"
                    className="responsive-grid"
                >
                    {pages.map((page) => (
                        <motion.div key={page.id} variants={fadeInUp}>
                            <Card className="h-full hover:border-primary/40 transition-colors relative group flex flex-col">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="bg-muted p-2 rounded-md group-hover:bg-primary/10 transition-colors">
                                            <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <Badge
                                            variant={page.is_published ? 'default' : 'secondary'}
                                            className={`flex items-center gap-1 ${page.is_published ? 'bg-green-600/15 text-green-500 hover:bg-green-600/25' : 'text-muted-foreground'}`}
                                        >
                                            {page.is_published ? <Globe className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                            {page.is_published ? 'Published' : 'Draft'}
                                        </Badge>
                                    </div>
                                    <CardTitle className="pt-3 text-lg leading-tight line-clamp-2" title={page.title}>
                                        {page.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="flex items-center text-xs text-muted-foreground bg-muted/50 p-2 rounded font-mono truncate">
                                        <span className="opacity-50 mr-1">/p/</span>
                                        <span className="truncate">{page.slug}</span>
                                        <a
                                            href={`/p/${page.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-auto hover:text-primary p-1"
                                            title="View live page"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end gap-2 pt-0 pb-4 px-4">
                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/pages/${page.id}`)}>
                                        <Edit className="h-4 w-4 mr-1.5" /> Edit
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleOpenDeleteModal(page)}>
                                        <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/10">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground">No custom pages found.</p>
                    <Button asChild variant="link" className="mt-2">
                        <RouterLink to="/admin/pages/new">Create your first page</RouterLink>
                    </Button>
                </div>
            )}

            <ConfirmationModal
                open={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Page Deletion"
                content={`Are you sure you want to permanently delete the page "${pageToDelete?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                confirmColor="destructive"
                loading={isActionLoading}
            />
        </div>
    );
}

export default AdminCustomPages;