import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, Edit, Image as ImageIcon, Save, User } from 'lucide-react';
import { constructImageUrl } from '../utils/url';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageCropperModal from '../components/ImageCropperModal';
import VerifiedIcons from '../components/VerifiedIcons';
import { Separator } from '@/components/ui/separator';
import PlayerCard from '../components/PlayerCard';


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

const ProfileFramePreview = ({ item, imagePreview }) => {
    const { user: currentUser } = useAuth();
    const displayUser = currentUser ? {
        ...currentUser,
        tags: currentUser.tags || [],
    } : {
        username: 'YourName',
        pfp_url: '/placeholders/avatar_placeholder.png',
        banner_url: '/placeholders/banner_placeholder.png',
        rank: { name: 'User', display_color: '#AAAAAA' },
        reputation_count: 123,
        clanMembership: { clan: { name: 'YourClan' } },
        first_login: new Date().toISOString(),
        tags: [],
    };
    const frameColor = item.cosmetic_data?.color || '#FF4D00';

    return (
        <PlayerCard
            user={displayUser}
            customFrameColor={frameColor}
            disableLink={true}
        />
    );
};

const AnimatedAvatarPreview = ({ item, imagePreview }) => {
    const { user: currentUser } = useAuth();
    const displayUser = currentUser ? {
        ...currentUser,
        tags: currentUser.tags || [],
    } : {
        username: 'YourName',
        pfp_url: '/placeholders/avatar_placeholder.png',
        banner_url: '/placeholders/banner_placeholder.png',
        rank: { name: 'User', display_color: '#AAAAAA' },
        reputation_count: 123,
        clanMembership: { clan: { name: 'YourClan' } },
        first_login: new Date().toISOString(),
        tags: [],
    };

    return (
        <PlayerCard
            user={displayUser}
            customAvatarUrl={imagePreview}
            disableLink={true}
        />
    );
};

const AnimatedBannerPreview = ({ item, imagePreview }) => {
    const { user: currentUser } = useAuth();
    const displayUser = currentUser ? {
        ...currentUser,
        tags: currentUser.tags || [],
    } : {
        username: 'YourName',
        pfp_url: '/placeholders/avatar_placeholder.png',
        banner_url: '/placeholders/banner_placeholder.png',
        rank: { name: 'User', display_color: '#AAAAAA' },
        reputation_count: 123,
        clanMembership: { clan: { name: 'YourClan' } },
        first_login: new Date().toISOString(),
        tags: [],
    };

    return (
        <PlayerCard
            user={displayUser}
            customBannerUrl={imagePreview}
            disableLink={true}
        />
    );
};

const ItemCardPreview = ({ item, imagePreview }) => {
    return (
        <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader className="p-4">
                <div className="aspect-square w-full overflow-hidden rounded-md bg-muted flex items-center justify-center">
                    <img src={constructImageUrl(imagePreview) || `https://robohash.org/default.png?set=set4`} alt="Item preview" className="w-full h-full object-cover" />
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4 pt-0">
                <CardTitle>{item.name || "Item Name"}</CardTitle>
                <CardDescription className="mt-1 flex-grow">{item.description || "Item description..."}</CardDescription>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <p className="text-xl font-bold">{item.price || 0} <span className="text-sm font-medium text-muted-foreground">coins</span></p>
            </CardFooter>
        </Card>
    );
};

const ItemPreviewCard = ({ item, imagePreview }) => {
    if (item.item_type === 'PROFILE_FRAME') {
        return <ProfileFramePreview item={item} imagePreview={imagePreview} />;
    }
    if (item.item_type === 'ANIMATED_AVATAR') {
        return <AnimatedAvatarPreview item={item} imagePreview={imagePreview} />;
    }
    if (item.item_type === 'ANIMATED_BANNER') {
        return <AnimatedBannerPreview item={item} imagePreview={imagePreview} />;
    }
    return <ItemCardPreview item={item} imagePreview={imagePreview} />;
};

function AdminEditItemPage() {
    const { itemId } = useParams();
    const navigate = useNavigate();
    const { authToken } = useAuth();
    const { setBreadcrumbs } = useBreadcrumbs();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '', description: '', price: 0, image_url: '',
        ingame_command: '', category: 'items', is_active: true,
        item_type: 'COMMAND',
        cosmetic_data: {}
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    const [cropperOpen, setCropperOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);

    useEffect(() => {
        const fetchItemData = async () => {
            try {
                const response = await axios.get(`/api/shop/${itemId}`, { headers: { Authorization: `Bearer ${authToken}` } });
                setFormData({
                    ...response.data,
                    cosmetic_data: response.data.cosmetic_data || {}
                });
                setImagePreview(response.data.image_url);
                setBreadcrumbs([
                    { label: 'Admin Panel' },
                    { label: 'Shop', link: '/admin/shop' },
                    { label: `Edit: ${response.data.name}` }
                ]);
            } catch (err) {
                setError('Failed to load item data.');
            } finally {
                setLoading(false);
            }
        };
        fetchItemData();
        return () => setBreadcrumbs([]);
    }, [itemId, authToken, setBreadcrumbs]);

    const handleChange = useCallback((e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);
    const handleCosmeticChange = useCallback((e) => {
        setFormData(prev => ({...prev, cosmetic_data: { ...prev.cosmetic_data, [e.target.name]: e.target.value }}));
    }, []);
    const handleSwitchChange = useCallback((checked) => {
        setFormData(prev => ({ ...prev, is_active: checked }));
    }, []);

    const handleItemTypeChange = useCallback((value) => {
        setFormData(p => ({...p, item_type: value, cosmetic_data: {}}));
    }, []);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // For animated avatars and banners, skip cropping to preserve animation
        const isAnimatedItem = formData.item_type === 'ANIMATED_AVATAR' || formData.item_type === 'ANIMATED_BANNER';
        const isAnimatedFormat = file.type === 'image/gif' || 
                                  file.type === 'image/avif' || 
                                  file.name.toLowerCase().endsWith('.gif') ||
                                  file.name.toLowerCase().endsWith('.avif');
        
        if (isAnimatedItem && isAnimatedFormat) {
            // Direct upload for animated items - no cropping to preserve animation
            const previewUrl = URL.createObjectURL(file);
            setImageFile(file);
            setImagePreview(previewUrl);
            event.target.value = null;
            return;
        }
        
        // For animated items with non-animated files, show warning
        if (isAnimatedItem && !isAnimatedFormat) {
            toast.error('Animated avatars and banners must be GIF or AVIF files to preserve animation.');
            event.target.value = null;
            return;
        }

        // For other images, use cropper
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImageToCrop(reader.result?.toString() || '');
            setCropperOpen(true);
        });
        reader.readAsDataURL(file);
        event.target.value = null;
    };

    const handleCropComplete = (croppedImageBlob) => {
        if (!croppedImageBlob) {
            setCropperOpen(false);
            return;
        }
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
                const uploadUrl = '/api/media/shop-item';

                const uploadResponse = await axios.post(uploadUrl, uploadFormData, { headers: { Authorization: `Bearer ${authToken}` } });
                finalImageUrl = uploadResponse.data.url;
            }
            const payload = { ...formData, image_url: finalImageUrl, price: Number(formData.price) };

            if (payload.item_type === 'COMMAND') {
                delete payload.cosmetic_data;
            } else {
                 payload.ingame_command = null;
            }

            await axios.patch(`/api/shop/${itemId}`, payload, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success('Item updated successfully!');
            navigate('/admin/shop');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update item.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin" /></div>;

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="font-sans text-3xl font-bold">Edit: {formData.name}</h1>
                     <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4"/>
                        Save Changes
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader><CardTitle>Item Details</CardTitle><CardDescription>Update the details for this shop item.</CardDescription></CardHeader>
                            <CardContent className="space-y-4">
                                {error && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                                <div className="space-y-2"><Label>Item Name</Label><Input name="name" value={formData.name || ''} onChange={handleChange} required /></div>
                                <div className="space-y-2"><Label>Description</Label><Textarea name="description" value={formData.description || ''} onChange={handleChange} /></div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Price (in coins)</Label><Input name="price" type="number" value={formData.price || 0} onChange={handleChange} required /></div>
                                    <div className="space-y-2"><Label>Category</Label><Input name="category" value={formData.category || ''} onChange={handleChange} required /></div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Item Type</Label>
                                    <Select value={formData.item_type} onValueChange={handleItemTypeChange}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PROFILE_FRAME">Profile Card Frame</SelectItem>
                                            <SelectItem value="ANIMATED_AVATAR">Animated Avatar</SelectItem>
                                            <SelectItem value="ANIMATED_BANNER">Animated Banner</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.item_type === 'PROFILE_FRAME' && (
                                    <div className="space-y-2"><Label>Frame Color</Label><Input type="color" name="color" value={formData.cosmetic_data?.color || '#FF4D00'} onChange={handleCosmeticChange} className="p-1 h-10 w-20" /></div>
                                )}
                                <div className="flex items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><Label className="text-base">Item is Active</Label><p className="text-sm text-muted-foreground">If disabled, this item will not be visible in the shop.</p></div><Switch name="is_active" checked={formData.is_active} onCheckedChange={handleSwitchChange} /></div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1 space-y-4 sticky top-6">
                         <Card>
                            <CardHeader><CardTitle>Live Preview</CardTitle></CardHeader>
                            <CardContent>
                               <ItemPreviewCard item={formData} imagePreview={imagePreview} />
                                <div className="space-y-2 mt-4">
                                    <Label>Item Image</Label>
                                    <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current.click()}><Edit className="mr-2 h-4 w-4" />Change Image</Button>
                                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                                </div>
                            </CardContent>
                         </Card>
                    </div>
                </div>
            </form>
            <ImageCropperModal open={cropperOpen} onClose={() => setCropperOpen(false)} imageSrc={imageToCrop} onCropComplete={handleCropComplete} aspect={1}/>
        </>
    );
}

export default AdminEditItemPage;
