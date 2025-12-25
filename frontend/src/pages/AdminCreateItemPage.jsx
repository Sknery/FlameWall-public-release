import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, Terminal, Edit, Image as ImageIcon, Save, User } from 'lucide-react';

import { constructImageUrl } from '../utils/url';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import ImageCropperModal from '../components/ImageCropperModal';
import VerifiedIcons from '../components/VerifiedIcons';
import { hexToHslString } from '../utils/colors';


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
    return <ItemCardPreview item={item} imagePreview={imagePreview} />;
};


function AdminCreateItemPage() {
    const navigate = useNavigate();
    const { authToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { setBreadcrumbs } = useBreadcrumbs();
    const [formData, setFormData] = useState({
        name: '', description: '', price: 0, image_url: '', ingame_command: '',
        category: 'items', is_active: true, item_type: 'COMMAND', cosmetic_data: {}
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    const [cropperOpen, setCropperOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);

    useEffect(() => {
        setBreadcrumbs([
            { label: 'Admin Panel' }, { label: 'Shop', link: '/admin/shop' }, { label: 'Create Item' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

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
        setLoading(true);
        setError('');
        try {
            let finalImageUrl = '';
            if (imageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', imageFile);
                const uploadUrl = '/api/media/shop-item';
                const uploadResponse = await axios.post(uploadUrl, uploadFormData, { headers: { Authorization: `Bearer ${authToken}` } });
                finalImageUrl = uploadResponse.data.url;
            }
            const payload = { ...formData, image_url: finalImageUrl, price: Number(formData.price) };
            if (payload.item_type === 'COMMAND') { delete payload.cosmetic_data; }
            else { payload.ingame_command = null; }
            await axios.post('/api/shop', payload, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success('Item created successfully!');
            navigate('/admin/shop');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create item.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h1 className="font-sans text-3xl font-bold">Create New Shop Item</h1>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4"/>
                        Create Item
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader><CardTitle>Item Details</CardTitle><CardDescription>Set up a new item to be sold in the shop.</CardDescription></CardHeader>
                            <CardContent className="space-y-4">
                                {error && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                                <div className="space-y-2"><Label>Item Name</Label><Input name="name" value={formData.name} onChange={handleChange} placeholder="e.g., VIP Rank (30 days)" required /></div>
                                <div className="space-y-2"><Label>Description</Label><Textarea name="description" value={formData.description} onChange={handleChange} placeholder="A short description of the item." /></div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Price (in coins)</Label><Input name="price" type="number" value={formData.price} onChange={handleChange} required /></div>
                                    <div className="space-y-2"><Label>Category</Label><Input name="category" value={formData.category} onChange={handleChange} placeholder="e.g., ranks, items" required /></div>
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
                                {formData.item_type === 'COMMAND' && (<div className="space-y-2"><Label>In-game Command</Label><Input name="ingame_command" value={formData.ingame_command} onChange={handleChange} placeholder="lp user {username} parent set vip" required /></div>)}
                                {formData.item_type === 'PROFILE_FRAME' && (<div className="space-y-2"><Label>Frame Color</Label><Input type="color" name="color" value={formData.cosmetic_data?.color || '#FF4D00'} onChange={handleCosmeticChange} className="p-1 h-10 w-20" /></div>)}
                                <div className="flex items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><Label className="text-base">Item is Active</Label><p className="text-sm text-muted-foreground">If disabled, this item will not be visible in the shop.</p></div><Switch name="is_active" checked={formData.is_active} onCheckedChange={handleSwitchChange} /></div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1 space-y-4 sticky top-6">
                         <Card>
                            <CardHeader>
                                <CardTitle>Live Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                               <ItemPreviewCard item={formData} imagePreview={imagePreview} />
                                <div className="space-y-2 mt-4">
                                    <Label>Item Image</Label>
                                    <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current.click()}><Edit className="mr-2 h-4 w-4" />Upload Image</Button>
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

export default AdminCreateItemPage;
