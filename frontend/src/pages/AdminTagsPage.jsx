import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { motion } from 'framer-motion';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, Plus, Edit, Trash2, Upload, Tag as TagIcon } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";


import ConfirmationModal from '../components/ConfirmationModal';
import { constructImageUrl } from '../utils/url';
import ImageCropperModal from '../components/ImageCropperModal';
import { listContainer, fadeInUp } from '../utils/animations';

function AdminTagsPage() {
    const { authToken } = useAuth();
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { setBreadcrumbs } = useBreadcrumbs();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState(null);
    const [formData, setFormData] = useState({ name: '', color: '#808080', icon_url: '' });
    const [iconFile, setIconFile] = useState(null);
    const [iconPreview, setIconPreview] = useState(null);
    const fileInputRef = useRef(null);

    const [modalError, setModalError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [tagToDelete, setTagToDelete] = useState(null);

    const [cropperOpen, setCropperOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);

    const fetchTags = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/tags/admin', { headers: { Authorization: `Bearer ${authToken}` } });
            setTags(response.data);
        } catch (err) {
            setError('Failed to load tags.');
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        setBreadcrumbs([ { label: 'Admin Panel' }, { label: 'Tags' } ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    useEffect(() => { fetchTags(); }, [fetchTags]);

    const handleOpenModal = (tag = null) => {
        setModalError('');
        setIconFile(null);
        if (tag) {
            setEditingTag(tag);
            setFormData({ name: tag.name, color: tag.color || '#808080', icon_url: tag.icon_url || '' });
            setIconPreview(tag.icon_url);
        } else {
            setEditingTag(null);
            setFormData({ name: '', color: '#808080', icon_url: '' });
            setIconPreview(null);
        }
        setIsModalOpen(true);
    };

    const handleFormChange = useCallback((e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);

    const handleFileChange = useCallback((event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImageToCrop(reader.result?.toString() || '');
            setCropperOpen(true);
        });
        reader.readAsDataURL(file);
        event.target.value = null;
    }, []);

    const handleCropComplete = (croppedImageBlob) => {
        if (!croppedImageBlob) {
            setCropperOpen(false);
            return;
        }
        const previewUrl = URL.createObjectURL(croppedImageBlob);
        setIconFile(croppedImageBlob);
        setIconPreview(previewUrl);
        setCropperOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setModalError('');
        try {
            let finalIconUrl = formData.icon_url;
            if (iconFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', iconFile, 'tag-icon.png');
                const res = await axios.post('/api/media/tag-icon', uploadFormData, { headers: { Authorization: `Bearer ${authToken}` } });
                finalIconUrl = res.data.url;
            }

            const payload = { ...formData, icon_url: finalIconUrl };

            const apiCall = editingTag
                ? axios.patch(`/api/tags/admin/${editingTag.id}`, payload, { headers: { Authorization: `Bearer ${authToken}` } })
                : axios.post('/api/tags/admin', payload, { headers: { Authorization: `Bearer ${authToken}` } });

            await apiCall;
            toast.success(`Tag successfully ${editingTag ? 'updated' : 'created'}!`);
            fetchTags();
            setIsModalOpen(false);
        } catch (err) {
            setModalError(err.response?.data?.message || 'An error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenDeleteModal = (tag) => {
        setTagToDelete(tag);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!tagToDelete) return;
        setIsSaving(true);
        try {
            await axios.delete(`/api/tags/admin/${tagToDelete.id}`, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success(`Tag "${tagToDelete.name}" deleted.`);
            fetchTags();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete tag.');
        } finally {
            setIsSaving(false);
            setIsConfirmModalOpen(false);
        }
    };

    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="font-sans text-3xl font-bold">Manage Tags</h1>
                <Button onClick={() => handleOpenModal()}><Plus className="mr-2 h-4 w-4" /> Create Tag</Button>
            </div>

            {loading ? <div className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin" /></div> :
                tags.length > 0 ? (
                    <motion.div
                        variants={listContainer}
                        initial="initial"
                        animate="animate"
                        className="responsive-grid"
                    >
                        {tags.map((tag) => (
                            <motion.div key={tag.id} variants={fadeInUp}>
                                <Card className="h-full hover:border-primary/40 transition-colors">
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="h-10 w-10 rounded-md flex items-center justify-center shadow-sm"
                                                style={{ backgroundColor: tag.color || '#808080' }}
                                            >
                                                <Avatar className="h-8 w-8 bg-transparent">
                                                    <AvatarImage src={constructImageUrl(tag.icon_url)} className="p-1" />
                                                    <AvatarFallback className="bg-transparent text-white/80"><TagIcon className="h-4 w-4" /></AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <div>
                                                <p className="font-semibold leading-none">{tag.name}</p>
                                                <p className="text-xs text-muted-foreground mt-1 font-mono">{tag.color}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenModal(tag)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleOpenDeleteModal(tag)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
                        <TagIcon className="h-12 w-12 mb-4 opacity-20" />
                        <p>No tags created yet.</p>
                        <Button variant="link" onClick={() => handleOpenModal()} className="mt-2">Create one now</Button>
                    </div>
                )
            }

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent 
                    className="sm:max-w-[425px]"
                    onOpenAutoFocus={(e) => {
                        e.preventDefault();
                    }}
                >
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingTag ? 'Edit Tag' : 'Create New Tag'}</DialogTitle>
                        </DialogHeader>
                        {modalError && <Alert variant="destructive" className="my-2"><Terminal className="h-4 w-4" /><AlertDescription>{modalError}</AlertDescription></Alert>}
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Tag Name</Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleFormChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Icon</Label>
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-md flex items-center justify-center shadow-sm" style={{backgroundColor: formData.color}}>
                                        <Avatar className="h-12 w-12 bg-transparent">
                                            <AvatarImage src={constructImageUrl(iconPreview)} className="p-1" />
                                            <AvatarFallback className="bg-transparent text-white/80"><TagIcon /></AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current.click()}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Icon
                                    </Button>
                                    <input type="file" ref={fileInputRef} hidden accept="image/png, image/jpeg, image/gif" onChange={handleFileChange} />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="color">Background Color</Label>
                                <div className="flex gap-2 items-center">
                                    <Input id="color" name="color" type="color" value={formData.color} onChange={handleFormChange} className="p-1 h-10 w-14 shrink-0 cursor-pointer" />
                                    <Input value={formData.color} onChange={handleFormChange} name="color" className="font-mono" />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmationModal
                open={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Tag Deletion"
                content={`Are you sure you want to delete the tag "${tagToDelete?.name}"? It will be removed from all user profiles.`}
                confirmText="Delete"
                confirmColor="destructive"
                loading={isSaving}
            />

            <ImageCropperModal
                open={cropperOpen}
                onClose={() => setCropperOpen(false)}
                imageSrc={imageToCrop}
                onCropComplete={handleCropComplete}
                aspect={1}
            />
        </div>
    );
}

export default AdminTagsPage;