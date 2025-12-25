

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Terminal, Shield, Upload } from 'lucide-react';


import ImageCropperModal from '../components/ImageCropperModal';
import { constructImageUrl } from '../utils/url';

function CreateClanPage() {
    const navigate = useNavigate();
    const { authToken, updateAuthToken } = useAuth();    const { setBreadcrumbs } = useBreadcrumbs();

    const [formData, setFormData] = useState({
        name: '',
        tag: '',
        description: '',
        join_type: 'closed',
    });

    const [iconFile, setIconFile] = useState(null);
    const [iconPreview, setIconPreview] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const iconInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    const [cropperOpen, setCropperOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);
    const [cropAspect, setCropAspect] = useState(1);
    const [cropType, setCropType] = useState('icon');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setBreadcrumbs([
            { label: 'Community', link: '/clans' },
            { label: 'Clans', link: '/clans' },
            { label: 'Create' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value) => {
        setFormData(prev => ({ ...prev, join_type: value }));
    };

    const handleFileChange = (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        setCropAspect(type === 'icon' ? 1 : 16 / 5);
        setCropType(type);

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
        if (cropType === 'icon') {
            setIconFile(croppedImageBlob);
            setIconPreview(previewUrl);
        } else {
            setBannerFile(croppedImageBlob);
            setBannerPreview(previewUrl);
        }
        setCropperOpen(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!iconFile || !bannerFile) {
            setError('Please upload both a clan icon and a banner.');
            return;
        }

        setLoading(true);
        try {
            const headers = { headers: { Authorization: `Bearer ${authToken}` } };

            const iconFormData = new FormData();
            iconFormData.append('file', iconFile, 'icon.png');
            const iconRes = await axios.post('/api/media/clan-icon', iconFormData, headers);
            const finalIconUrl = iconRes.data.url;

            const bannerFormData = new FormData();
            bannerFormData.append('file', bannerFile, 'banner.png');
            const bannerRes = await axios.post('/api/media/clan-banner', bannerFormData, headers);
            const finalBannerUrl = bannerRes.data.url;

            const finalPayload = {
                ...formData,
                card_icon_url: finalIconUrl,
                card_image_url: finalBannerUrl,
            };

            const response = await axios.post('/api/clans', finalPayload, headers);

            const profileResponse = await axios.get('/api/auth/profile', headers);
            updateAuthToken(profileResponse.data.access_token);

            toast.success('Clan created successfully!');
            navigate(`/clans/${response.data.tag}`);
        } catch (err) {
            const message = err.response?.data?.message;
            setError(Array.isArray(message) ? message.join(', ') : message || 'Failed to create clan.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="space-y-6">
                <h1 className="font-sans text-3xl font-bold">Found a New Clan</h1>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Clan Details</CardTitle>
                                    <CardDescription>This information will be publicly visible. You can change most of it later.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {error && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label htmlFor="name">Clan Name</Label><Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., The Shadow Syndicate" required /></div>
                                        <div className="space-y-2"><Label htmlFor="tag">Unique Tag</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span><Input id="tag" name="tag" value={formData.tag} onChange={handleChange} placeholder="shadow_syndicate" className="pl-6" required /></div><p className="text-xs text-muted-foreground">Cannot be changed later. Only letters, numbers, and underscores.</p></div>
                                    </div>
                                    <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe your clan's goals, rules, and what you're looking for in members." required/></div>
                                    <div className="space-y-2"><Label htmlFor="join_type">Join Method</Label><Select name="join_type" value={formData.join_type} onValueChange={handleSelectChange}><SelectTrigger id="join_type"><SelectValue placeholder="Select how players can join" /></SelectTrigger><SelectContent><SelectItem value="closed">Closed (Invite Only)</SelectItem><SelectItem value="application">By Application</SelectItem><SelectItem value="open">Open to Everyone</SelectItem></SelectContent></Select></div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Appearance</CardTitle>
                                    <CardDescription>Customize your clan's public appearance.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Clan Icon (Required)</Label>
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-20 w-20"><AvatarImage src={constructImageUrl(iconPreview)} /><AvatarFallback><Shield className="h-8 w-8" /></AvatarFallback></Avatar>
                                            <Button type="button" variant="outline" onClick={() => iconInputRef.current.click()}><Upload className="mr-2 h-4 w-4" />Upload</Button>
                                            <input type="file" accept="image/*" hidden ref={iconInputRef} onChange={(e) => handleFileChange(e, 'icon')} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Clan Banner (Required)</Label>
                                        <div className="aspect-[16/5] w-full rounded-md bg-muted bg-cover bg-center" style={{ backgroundImage: `url(${constructImageUrl(bannerPreview) || '/placeholders/banner_placeholder.png'})` }} />
                                        <Button type="button" variant="outline" onClick={() => bannerInputRef.current.click()}><Upload className="mr-2 h-4 w-4" />Upload Banner</Button>
                                        <input type="file" accept="image/*" hidden ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button type="submit" disabled={loading} size="lg">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Shield className="mr-2 h-4 w-4"/>
                            Establish Clan
                        </Button>
                    </div>
                </form>
            </div>
            <ImageCropperModal open={cropperOpen} onClose={() => setCropperOpen(false)} imageSrc={imageToCrop} onCropComplete={handleCropComplete} aspect={cropAspect} />
        </>
    );
}

export default CreateClanPage;

