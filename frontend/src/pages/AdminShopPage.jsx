import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { motion } from 'framer-motion';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from "@/components/ui/separator";
import { Loader2, Terminal, Plus, Edit, Trash2, Image as ImageIcon, Save, User, Eye } from 'lucide-react';


import ConfirmationModal from '../components/ConfirmationModal';
import { constructImageUrl } from '../utils/url';
import { listContainer, fadeInUp } from '../utils/animations';
import VerifiedIcons from '../components/VerifiedIcons';
import ImageCropperModal from '../components/ImageCropperModal';


const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
    useEffect(() => {
        const mediaQueryList = window.matchMedia(query);
        const listener = (event) => setMatches(event.matches);
        mediaQueryList.addEventListener('change', listener);
        return () => mediaQueryList.removeEventListener('change', listener);
    }, [query]);
    return matches;
};

const lightenHexColor = (hex, percent) => {
    if (!hex) return '#ffffff';
    hex = hex.replace(/^\s*#|\s*$/g, '');
    if (hex.length === 3) hex = hex.replace(/(.)/g, '$1$1');
    const r = parseInt(hex.substr(0, 2), 16), g = parseInt(hex.substr(2, 2), 16), b = parseInt(hex.substr(4, 6), 16);
    return '#' +
       ((0|(1<<8) + r + (256 - r) * percent / 100).toString(16)).substr(1) +
       ((0|(1<<8) + g + (256 - g) * percent / 100).toString(16)).substr(1) +
       ((0|(1<<8) + b + (256 - b) * percent / 100).toString(16)).substr(1);
};

const ProfileFramePreview = ({ item }) => {
    const { user: currentUser } = useAuth();
    const displayUser = currentUser || { username: 'YourName', pfp_url: null, banner_url: null, rank: { name: 'User', display_color: '#AAAAAA' } };
    const frameColor = item.cosmetic_data?.color || '#FF4D00';
    const lightFrameColor = lightenHexColor(frameColor, 60);

    return (
        <div className="relative rounded-xl overflow-hidden p-[2px] h-full flex flex-col">
            <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite]" style={{ background: `conic-gradient(from 90deg at 50% 50%, ${lightFrameColor} 0%, ${frameColor} 50%, ${lightFrameColor} 100%)` }}/>
            <div className="relative z-10 bg-card rounded-[10px] h-full flex flex-col">
                <CardContent className="flex flex-col items-center text-center p-6 pb-2 flex-grow">
                    <div className="w-full aspect-[16/5] rounded-t-lg bg-cover bg-center" style={{ backgroundImage: `url(${constructImageUrl(displayUser.banner_url) || '/placeholders/banner_placeholder.png'})` }}/>
                    <div className="w-[30%] -mt-[18%]"><Avatar className="h-full w-full aspect-square border-4 border-background"><AvatarImage src={constructImageUrl(displayUser.pfp_url)} /><AvatarFallback><User className="h-[60%] w-[60%]" /></AvatarFallback></Avatar></div>
                    <h2 className="font-sans mt-4 flex items-center gap-2 text-xl font-bold">{displayUser.username}<VerifiedIcons user={displayUser} /></h2>
                    <p className="text-sm font-semibold" style={{ color: displayUser.rank?.display_color }}>{displayUser.rank?.name}</p>
                </CardContent>
                <CardFooter className="p-4 pt-2 mt-auto flex-col items-stretch gap-2">
                     <div className="w-full text-center"><h3 className="font-bold text-lg">{item.name || "Item Name"}</h3><p className="text-xs text-muted-foreground">{item.description || "Item description..."}</p></div>
                    <Separator className="my-2" />
                    <p className="text-xl font-bold text-center">{item.price || 0} <span className="text-sm font-medium text-muted-foreground">coins</span></p>
                </CardFooter>
            </div>
        </div>
    );
};

const ItemCardPreview = ({ item, imagePreview }) => (
    <Card className="h-full flex flex-col overflow-hidden">
        <CardHeader className="p-4">
            <div className="aspect-square w-full overflow-hidden rounded-md bg-muted">
                <img
                    src={constructImageUrl(imagePreview) || `https://robohash.org/${item.item_id || 'default'}.png?set=set4`}
                    alt={item.name}
                    className="w-full h-full object-cover"
                />
            </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4 pt-0">
            <CardTitle>{item.name || "Item Name"}</CardTitle>
            <CardDescription className="mt-1 flex-grow">{item.description || "Item description..."}</CardDescription>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
            <p className="text-xl font-bold">{item.price || 0} <span className="text-sm font-medium text-muted-foreground">coins</span></p>
        </CardFooter>
    </Card>
);

const ItemPreviewCard = ({ item, imagePreview }) => {
    if (item.item_type === 'PROFILE_FRAME') {
        return <ProfileFramePreview item={item} />;
    }
    return <ItemCardPreview item={item} imagePreview={imagePreview} />;
};

const ItemEditModal = ({ open, onClose, item, onSaveSuccess }) => {
    const { authToken } = useAuth();
    const isEditing = !!item;
    const isDesktop = useMediaQuery('(min-width: 768px)');

    const [formData, setFormData] = useState({});
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

    useEffect(() => {
        if (open) {
            const initialData = isEditing ? { ...item, cosmetic_data: item.cosmetic_data || {} } : {
                name: '', description: '', price: 0, image_url: '', ingame_command: '',
                category: 'items', is_active: true, item_type: 'COMMAND', cosmetic_data: {}
            };
            setFormData(initialData);
            setImagePreview(isEditing ? item.image_url : null);
            setImageFile(null);
            setError('');
        }
    }, [open, item, isEditing]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleCosmeticChange = (e) => setFormData(prev => ({...prev, cosmetic_data: { ...prev.cosmetic_data, [e.target.name]: e.target.value }}));
    const handleSwitchChange = (checked) => setFormData(prev => ({ ...prev, is_active: checked }));

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.addEventListener('load', () => { setImageToCrop(reader.result?.toString() || ''); setCropperOpen(true); });
        reader.readAsDataURL(file);
        event.target.value = null;
    };

    const handleCropComplete = (croppedImageBlob) => {
        if (!croppedImageBlob) { setCropperOpen(false); return; }
        const previewUrl = URL.createObjectURL(croppedImageBlob);
        setImageFile(croppedImageBlob);
        setImagePreview(previewUrl);
        setCropperOpen(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSaving(true);
        setError('');
        try {
            let finalImageUrl = formData.image_url;
            if (imageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', imageFile);
                const uploadResponse = await axios.post('/api/media/shop-item', uploadFormData, { headers: { Authorization: `Bearer ${authToken}` } });
                finalImageUrl = uploadResponse.data.url;
            }
            const payload = { ...formData, image_url: finalImageUrl, price: Number(formData.price) };
            if (payload.item_type === 'COMMAND') delete payload.cosmetic_data;
            else payload.ingame_command = null;

            const apiCall = isEditing
                ? axios.patch(`/api/shop/${item.item_id}`, payload, { headers: { Authorization: `Bearer ${authToken}` } })
                : axios.post('/api/shop', payload, { headers: { Authorization: `Bearer ${authToken}` } });

            await apiCall;
            toast.success(`Item ${isEditing ? 'updated' : 'created'} successfully!`);
            onSaveSuccess();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} item.`);
        } finally {
            setIsSaving(false);
        }
    };

    const FormFields = () => (
        <>
            {error && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="space-y-2"><Label>Item Name</Label><Input name="name" value={formData.name || ''} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea name="description" value={formData.description || ''} onChange={handleChange} /></div>
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Price (in coins)</Label><Input name="price" type="number" value={formData.price || 0} onChange={handleChange} required /></div>
                <div className="space-y-2"><Label>Category</Label><Input name="category" value={formData.category || ''} onChange={handleChange} required /></div>
            </div>
             <div className="space-y-2">
                <Label>Item Image</Label>
                <div className="flex items-center gap-4">
                    {imagePreview && (
                        <div className="w-16 h-16 rounded-md bg-muted overflow-hidden">
                            <img src={constructImageUrl(imagePreview)} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current.click()}><Edit className="mr-2 h-4 w-4" />{imagePreview ? 'Change' : 'Upload'} Image</Button>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                </div>
            </div>
            <div className="space-y-2"><Label>Item Type</Label>
                <Select value={formData.item_type} onValueChange={(value) => setFormData(p => ({...p, item_type: value, cosmetic_data: {}}))}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="COMMAND">Command (e.g., Rank)</SelectItem>
                        <SelectItem value="PROFILE_FRAME">Profile Card Frame</SelectItem>
                        <SelectItem value="AVATAR_FRAME" disabled>Avatar Frame (soon)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {formData.item_type === 'COMMAND' && (
                <div className="space-y-2"><Label>In-game Command</Label><Input name="ingame_command" value={formData.ingame_command || ''} onChange={handleChange} placeholder="lp user {username} parent set vip" required /></div>
            )}
            {formData.item_type === 'PROFILE_FRAME' && (
                <div className="space-y-2"><Label>Frame Color</Label><Input type="color" name="color" value={formData.cosmetic_data?.color || '#FF4D00'} onChange={handleCosmeticChange} className="p-1 h-10 w-20" /></div>
            )}
            <div className="flex items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><Label className="text-base">Item is Active</Label><p className="text-sm text-muted-foreground">If disabled, this item will not be visible in the shop.</p></div><Switch name="is_active" checked={formData.is_active} onCheckedChange={handleSwitchChange} /></div>
        </>
    );

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? `Edit: ${item?.name || ''}` : 'Create New Shop Item'}</DialogTitle>
                        <DialogDescription>{isEditing ? 'Update the details for this shop item.' : 'Set up a new item to be sold in the shop.'}</DialogDescription>
                    </DialogHeader>

                    <form id="item-edit-form" onSubmit={handleSubmit} className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                        <div className="md:col-span-2 space-y-4 overflow-y-auto h-full pr-4">
                           <FormFields />
                        </div>

                        {isDesktop && (
                            <div className="md:col-span-1 space-y-4 sticky top-0 h-full overflow-y-auto">
                                 <Card>
                                    <CardHeader><CardTitle>Live Preview</CardTitle></CardHeader>
                                    <CardContent>
                                       <ItemPreviewCard item={formData} imagePreview={imagePreview} />
                                    </CardContent>
                                 </Card>
                            </div>
                        )}
                    </form>

                    <DialogFooter className="pt-4 border-t flex justify-between sm:justify-between">
                        <div>
                            {!isDesktop && (
                                <Button type="button" variant="outline" onClick={() => setIsPreviewModalOpen(true)}>
                                    <Eye className="mr-2 h-4 w-4" /> Preview
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit" form="item-edit-form" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4"/>
                                {isEditing ? 'Save Changes' : 'Create Item'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {!isDesktop && (
                 <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
                    <DialogContent className="sm:max-w-sm p-4">
                        <DialogHeader>
                            <DialogTitle>Item Preview</DialogTitle>
                        </DialogHeader>
                        <div className="p-4">
                            <ItemPreviewCard item={formData} imagePreview={imagePreview} />
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setIsPreviewModalOpen(false)}>Back to Editing</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            <ImageCropperModal open={cropperOpen} onClose={() => setCropperOpen(false)} imageSrc={imageToCrop} onCropComplete={handleCropComplete} aspect={1}/>
        </>
    );
};


function AdminShopPage() {
    const { authToken } = useAuth();
    const { setBreadcrumbs } = useBreadcrumbs();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            const itemsRes = await axios.get('/api/shop', config);
            setItems(itemsRes.data);
        } catch (err) {
            setError('Failed to load shop data.');
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        setBreadcrumbs([{ label: 'Admin Panel' }, { label: 'Shop Management' }]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenModal = (item = null) => {
        setEditingItem(item);
        setIsEditModalOpen(true);
    };

    const handleSaveSuccess = () => {
        setIsEditModalOpen(false);
        fetchData();
    };

    const handleOpenDeleteModal = (item) => {
        setItemToDelete(item);
        setConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setIsActionLoading(true);
        try {
            await axios.delete(`/api/shop/${itemToDelete.item_id}`, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success(`Item "${itemToDelete.name}" deleted successfully.`);
            fetchData();
        } catch (err) {
            toast.error('Failed to delete item.');
        } finally {
            setIsActionLoading(false);
            setConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="font-sans text-3xl font-bold">Shop Management</h1>
                <Button onClick={() => handleOpenModal(null)}><Plus className="mr-2 h-4 w-4" />Create Item</Button>
            </div>

            <motion.div variants={listContainer} initial="initial" animate="animate" className="responsive-grid-sm">
                {items.map((item) => (
                    <motion.div key={item.item_id} variants={fadeInUp}>
                        <ItemCard
                            item={item}
                            onEdit={() => handleOpenModal(item)}
                            onDelete={handleOpenDeleteModal}
                        />
                    </motion.div>
                ))}
            </motion.div>

            {!loading && items.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No items found in the shop.</p>
            )}

            <ItemEditModal
                open={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                item={editingItem}
                onSaveSuccess={handleSaveSuccess}
            />

            <ConfirmationModal
                open={isConfirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Item Deletion"
                content={`Are you sure you want to permanently delete the item "${itemToDelete?.name}"?`}
                confirmText="Delete"
                confirmColor="destructive"
                loading={isActionLoading}
            />
        </div>
    );
}

const ItemCard = ({ item, onEdit, onDelete }) => {
    return (
        <Card className="h-full flex flex-col overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="p-4">
                <div className="aspect-square w-full overflow-hidden rounded-md bg-muted">
                    <img
                        src={constructImageUrl(item.image_url) || `https://robohash.org/${item.item_id}.png?set=set4`}
                        alt={item.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
            <div className="flex-1 flex flex-col p-4 pt-0">
                 <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <Badge variant={item.is_active ? 'default' : 'outline'} className={item.is_active ? 'bg-green-600' : ''}>
                        {item.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                </div>
                <CardDescription className="mt-1 flex-grow text-xs">{item.category} / {item.item_type}</CardDescription>
                <div className="flex justify-between items-center mt-auto pt-4">
                    <p className="text-xl font-bold">{item.price} <span className="text-sm font-medium text-muted-foreground">coins</span></p>
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(item)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};


export default AdminShopPage;

