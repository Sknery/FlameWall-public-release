import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Terminal, Plus, Edit, Trash2, Layers, Hash } from 'lucide-react';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';


import ConfirmationModal from '../components/ConfirmationModal';
import { listContainer, fadeInUp } from '../utils/animations';

function AdminPageCategories() {
    const { authToken } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { setBreadcrumbs } = useBreadcrumbs();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', display_order: 0 });
    const [modalError, setModalError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/admin/page-categories', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setCategories(response.data);
        } catch (err) {
            setError('Failed to load page categories.');
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        setBreadcrumbs([
            { label: 'Admin Panel' },
            { label: 'Pages', link: '/admin/pages' },
            { label: 'Categories' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleOpenModal = (category = null) => {
        setModalError('');
        if (category) {
            setEditingCategory(category);
            setFormData({ name: category.name, display_order: category.display_order });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', display_order: 0 });
        }
        setIsModalOpen(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        const finalValue = name === 'display_order' ? parseInt(value, 10) || 0 : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setModalError('');
        const apiCall = editingCategory
            ? axios.patch(`/api/admin/page-categories/${editingCategory.id}`, formData, { headers: { Authorization: `Bearer ${authToken}` } })
            : axios.post('/api/admin/page-categories', formData, { headers: { Authorization: `Bearer ${authToken}` } });

        try {
            await apiCall;
            toast.success(`Category successfully ${editingCategory ? 'updated' : 'created'}!`);
            fetchCategories();
            setIsModalOpen(false);
        } catch (err) {
            setModalError(err.response?.data?.message || 'An error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenDeleteModal = (category) => {
        setCategoryToDelete(category);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!categoryToDelete) return;
        setIsSaving(true);
        try {
            await axios.delete(`/api/admin/page-categories/${categoryToDelete.id}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success(`Category "${categoryToDelete.name}" deleted.`);
            fetchCategories();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete category.');
        } finally {
            setIsSaving(false);
            setIsConfirmModalOpen(false);
        }
    };

    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="font-sans text-3xl font-bold">Page Categories</h1>
                <Button onClick={() => handleOpenModal()}><Plus className="mr-2 h-4 w-4" /> Create Category</Button>
            </div>

            {loading ? <div className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin" /></div> :
                categories.length > 0 ? (
                    <motion.div
                        variants={listContainer}
                        initial="initial"
                        animate="animate"
                        className="responsive-grid"
                    >
                        {categories.map((category) => (
                            <motion.div key={category.id} variants={fadeInUp}>
                                <Card className="h-full hover:border-primary/40 transition-colors relative group">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            Category ID: {category.id}
                                        </CardTitle>
                                        <Layers className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="text-xl font-bold truncate" title={category.name}>{category.name}</div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <Badge variant="secondary" className="font-mono">
                                                <Hash className="h-3 w-3 mr-1" />
                                                Order: {category.display_order}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2 pt-0">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(category)}>
                                            <Edit className="h-4 w-4 mr-1.5" /> Edit
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleOpenDeleteModal(category)}>
                                            <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/10">
                        <Layers className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                        <p className="text-muted-foreground">No categories created yet.</p>
                        <Button variant="link" onClick={() => handleOpenModal()} className="mt-2">Create one now</Button>
                    </div>
                )
            }

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
                        </DialogHeader>
                        {modalError && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertDescription>{modalError}</AlertDescription></Alert>}
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleFormChange} placeholder="e.g. Information" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="display_order">Display Order</Label>
                                <Input id="display_order" name="display_order" type="number" value={formData.display_order} onChange={handleFormChange} placeholder="0" />
                                <p className="text-xs text-muted-foreground">Lower numbers appear first in the menu.</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>


            <ConfirmationModal
                open={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Category Deletion"
                content={`Are you sure you want to delete "${categoryToDelete?.name}"? Pages within this category will become uncategorized.`}
                confirmText="Delete"
                confirmColor="destructive"
                loading={isSaving}
            />
        </div>
    );
}

export default AdminPageCategories;