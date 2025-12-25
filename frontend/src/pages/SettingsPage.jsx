
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate, Link as RouterLink, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Loader2, Edit, Link as LinkIcon, History, Terminal, BellRing, User, CheckCircle, X, ChevronsUpDown, Save, Mail, KeyRound, Palette, Shield } from 'lucide-react';


import { constructImageUrl } from '../utils/url';
import ImageCropperModal from '../components/ImageCropperModal';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { cn } from '@/lib/utils';

const TagsCombobox = ({ availableTags, selectedTags, onSelectionChange }) => {
    const [open, setOpen] = useState(false);

    const handleSelect = (tag) => {
        if (selectedTags.some(t => t.id === tag.id)) {
            onSelectionChange(selectedTags.filter(t => t.id !== tag.id));
        } else if (selectedTags.length < 3) {
            onSelectionChange([...selectedTags, tag]);
        } else {
            toast.error("You can select a maximum of 3 tags.");
        }
    };

    return (
        <div className="space-y-2 w-full min-w-0">
            <Label>Profile Tags</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between h-auto min-h-10 py-2 px-3 whitespace-normal text-left max-w-full"
                    >
                        <div className="flex flex-wrap gap-1 overflow-hidden w-full max-w-full">
                            {selectedTags.length > 0 ? selectedTags.map(tag => (
                                <Badge key={tag.id} variant="secondary" style={{ backgroundColor: tag.color, color: '#fff' }} className="shrink-0 max-w-full truncate">
                                    {tag.icon_url && <img src={constructImageUrl(tag.icon_url)} alt={tag.name} className="h-3 w-3 mr-1" />}
                                    <span className="truncate">{tag.name}</span>
                                </Badge>
                            )) : <span className="text-muted-foreground font-normal truncate w-full">Select tags...</span>}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search tags..." />
                        <CommandList>
                            <CommandEmpty>No tags found.</CommandEmpty>
                            <CommandGroup>
                                {availableTags.map((tag) => (
                                    <CommandItem
                                        key={tag.id}
                                        value={tag.name}
                                        onSelect={() => handleSelect(tag)}
                                    >
                                        <CheckCircle className={cn("mr-2 h-4 w-4", selectedTags.some(t => t.id === tag.id) ? "opacity-100" : "opacity-0")} />
                                        {tag.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
};

const SettingsSection = ({ title, description, children, footer, className }) => (
    <Card className={cn("h-full shadow-sm border bg-background", className)}>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
            {children}
        </CardContent>
        {footer && (
            <>
                <Separator />
                <CardFooter className="pt-6 bg-muted/20">
                    {footer}
                </CardFooter>
            </>
        )}
    </Card>
);

function SettingsPage({ isWidgetMode = false }) {
    const { authToken, updateAuthToken, user, refreshUser } = useAuth();
    const { setBreadcrumbs } = useBreadcrumbs();

    const outletContext = useOutletContext();
    const setLayoutOptions = outletContext?.setLayoutOptions;

    const [profileData, setProfileData] = useState({ username: '', profile_slug: '', description: '' });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [emailData, setEmailData] = useState({ newEmail: '', currentPassword: '' });
    const [selectedTags, setSelectedTags] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const avatarInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [isSavingEmail, setIsSavingEmail] = useState(false);

    const [cropperOpen, setCropperOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);
    const [cropAspect, setCropAspect] = useState(1);
    const [cropType, setCropType] = useState('avatar');

    const [ownedFrames, setOwnedFrames] = useState([]);
    const [isEquipping, setIsEquipping] = useState(false);

    const { subscribe, isSubscribed, error: pushError } = usePushNotifications();

    useEffect(() => {
        if (!isWidgetMode && setLayoutOptions) {
            setLayoutOptions({ noPadding: true, hasBottomPadding: false });
            return () => setLayoutOptions({ noPadding: false, hasBottomPadding: true });
        }
    }, [isWidgetMode, setLayoutOptions]);

    useEffect(() => {
        if (user) {
            setProfileData({
                username: user.username || '',
                profile_slug: user.profile_slug || '',
                description: user.description || '',
            });
            setAvatarPreview(user.pfp_url);
            setBannerPreview(user.banner_url);
            setSelectedTags(user.tags || []);
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (pushError) toast.error(pushError);
    }, [pushError]);

    useEffect(() => {
        if (!isWidgetMode) {
            setBreadcrumbs([
                { label: 'My Profile', link: '/profile/me' },
                { label: 'Settings' }
            ]);
        }

        const fetchPageData = async () => {
            if (!authToken) return;
            try {
                const [tagsRes, framesRes] = await Promise.all([
                    axios.get('/api/tags'),
                    axios.get('/api/users/me/cosmetics/PROFILE_FRAME', { headers: { Authorization: `Bearer ${authToken}` } })
                ]);
                setAvailableTags(tagsRes.data);
                setOwnedFrames(framesRes.data);
            } catch (err) {
                console.error("Failed to load page data:", err);
                toast.error("Could not load some page data.");
            }
        };

        fetchPageData();
        return () => {
            if (!isWidgetMode) {
                setBreadcrumbs([]);
            }
        };
    }, [setBreadcrumbs, authToken, isWidgetMode]);

    const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });
    const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    const handleEmailChange = (e) => setEmailData({ ...emailData, [e.target.name]: e.target.value });

    const handleFileChange = (event, type) => {
        const file = event.target.files[0];
        if (!file) return;
        setCropAspect(type === 'avatar' ? 1 : 16 / 5);
        setCropType(type);
        const reader = new FileReader();
        reader.addEventListener('load', () => { setImageToCrop(reader.result?.toString() || ''); setCropperOpen(true); });
        reader.readAsDataURL(file);
    };

    const handleCropComplete = (croppedImageBlob) => {
        if (!croppedImageBlob) { setCropperOpen(false); return; }
        const previewUrl = URL.createObjectURL(croppedImageBlob);
        if (cropType === 'avatar') { setAvatarFile(croppedImageBlob); setAvatarPreview(previewUrl); }
        else { setBannerFile(croppedImageBlob); setBannerPreview(previewUrl); }
        setCropperOpen(false);
    };

    const handleSaveAll = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        const headers = { headers: { Authorization: `Bearer ${authToken}` } };

        try {
            if (avatarFile) {
                const formData = new FormData();
                formData.append('file', avatarFile, 'avatar.png');
                await axios.post('/api/media/avatar', formData, headers);
            }

            if (bannerFile) {
                const formData = new FormData();
                formData.append('file', bannerFile, 'banner.png');
                await axios.post('/api/media/banner', formData, headers);
            }

            const tagIds = selectedTags.map(t => t.id);
            await axios.patch('/api/users/me/tags', { tagIds }, headers);

            await axios.patch('/api/users/me', profileData, headers);

            await refreshUser();

            toast.success('Profile updated successfully!');
            setAvatarFile(null);
            setBannerFile(null);
        } catch (err) {
            const message = err.response?.data?.message;
            const errorMessage = Array.isArray(message) ? message.join(', ') : message;
            setError(errorMessage || 'Failed to update profile.');
            toast.error(errorMessage || 'Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        if (passwordData.newPassword !== passwordData.confirmPassword) { setPasswordError('New passwords do not match.'); return; }
        setIsSavingPassword(true);
        try {
            await axios.post('/api/auth/change-password', { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Failed to change password.');
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setEmailError('');
        setIsSavingEmail(true);
        try {
            const response = await axios.post('/api/auth/request-email-change', emailData, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success(response.data.message);
            setEmailData({ newEmail: '', currentPassword: '' });
        } catch (err) {
            setEmailError(err.response?.data?.message || 'Failed to request email change.');
            toast.error(err.response?.data?.message || 'Failed to request email change.');
        } finally {
            setIsSavingEmail(false);
        }
    };

    const handleEquipFrame = async (itemId) => {
        setIsEquipping(true);
        try {
            const response = await axios.post('/api/users/me/equip-frame',
                { itemId },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            updateAuthToken(response.data.access_token);
            toast.success(itemId ? 'Frame equipped!' : 'Frame unequipped.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to equip frame.');
        } finally {
            setIsEquipping(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin" /></div>;

    if (isWidgetMode) {
        return (
            <div className="w-full max-w-full">
                <Button onClick={handleSaveAll} disabled={isSaving} className="w-full mb-4">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save All Changes
                </Button>

                {error && <Alert variant="destructive" className="mb-4"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile"><User className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Profile</span></TabsTrigger>
                        <TabsTrigger value="visuals"><Palette className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Visuals</span></TabsTrigger>
                        <TabsTrigger value="account"><Shield className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Account</span></TabsTrigger>
                    </TabsList>

                    {}
                    <TabsContent value="profile" className="space-y-4 mt-4">
                        <div className="space-y-4 px-1">
                            <div className="flex flex-col gap-3 p-3 border rounded-lg bg-muted/20">
                                <Label className="text-xs uppercase text-muted-foreground">Basic Info</Label>
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input id="username" name="username" value={profileData.username} onChange={handleProfileChange} className="w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="profile_slug">Slug (@)</Label>
                                    <Input id="profile_slug" name="profile_slug" value={profileData.profile_slug || ''} onChange={handleProfileChange} className="w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Bio</Label>
                                    <Textarea id="description" name="description" rows={3} className="resize-none" value={profileData.description || ''} onChange={handleProfileChange} placeholder="About you..." />
                                </div>
                                <TagsCombobox availableTags={availableTags} selectedTags={selectedTags} onSelectionChange={setSelectedTags} />
                            </div>
                        </div>
                    </TabsContent>

                    {}
                    <TabsContent value="visuals" className="space-y-4 mt-4">
                        <div className="space-y-4 px-1">
                            <div className="flex flex-col gap-3 p-3 border rounded-lg bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 ring-1 ring-border">
                                        <AvatarImage src={constructImageUrl(avatarPreview)} />
                                        <AvatarFallback><User /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">Profile Picture</p>
                                        <Button type="button" variant="outline" size="sm" onClick={() => avatarInputRef.current.click()} className="h-7 text-xs mt-1">Change</Button>
                                        <input type="file" accept="image/*" hidden ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="account" className="space-y-4 mt-4">
                        <div className="space-y-4 px-1">
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                <div className="space-y-0.5">
                                    <Label>Notifications</Label>
                                    <p className="text-[10px] text-muted-foreground">Push alerts</p>
                                </div>
                                <Switch checked={isSubscribed} onCheckedChange={subscribe} disabled={isSubscribed} />
                            </div>

                            <div className="flex flex-col gap-3 p-3 border rounded-lg bg-muted/20">
                                <Label>Change Email</Label>
                                {emailError && <p className="text-xs text-destructive">{emailError}</p>}
                                <Input placeholder="New Email" name="newEmail" value={emailData.newEmail} onChange={handleEmailChange} className="h-8 text-xs" />
                                <Input type="password" placeholder="Current Password" name="currentPassword" value={emailData.currentPassword} onChange={handleEmailChange} className="h-8 text-xs" />
                                <Button onClick={handleEmailSubmit} disabled={isSavingEmail} size="sm" variant="secondary" className="h-7 text-xs w-full">Request Change</Button>
                            </div>

                            <div className="flex flex-col gap-3 p-3 border rounded-lg bg-muted/20">
                                <Label>Change Password</Label>
                                {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
                                <Input type="password" placeholder="Current" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} className="h-8 text-xs" />
                                <Input type="password" placeholder="New" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className="h-8 text-xs" />
                                <Input type="password" placeholder="Confirm" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="h-8 text-xs" />
                                <Button onClick={handlePasswordSubmit} disabled={isSavingPassword} size="sm" variant="secondary" className="h-7 text-xs w-full">Update Password</Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
                <ImageCropperModal open={cropperOpen} onClose={() => setCropperOpen(false)} imageSrc={imageToCrop} onCropComplete={handleCropComplete} aspect={cropAspect} />
            </div>
        );
    }

    const wrapperClasses = "h-full w-full overflow-y-auto p-6 md:p-8 bg-black scrollbar-left";

    return (
        <div className={wrapperClasses}>
            <div className="ltr">
                <div className=" mx-auto mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="font-sans text-3xl font-bold">Settings</h1>
                        <p className="text-muted-foreground mt-1">Manage your profile, security, and preferences.</p>
                    </div>
                    <Button onClick={handleSaveAll} disabled={isSaving} size="lg" className="shrink-0">
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Save All Changes
                    </Button>
                </div>

                {error && <Alert variant="destructive" className="mb-6 max-w-7xl mx-auto"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mx-auto items-start">

                    <div className="lg:col-span-7 space-y-6">
                        <SettingsSection
                            title="Profile Information"
                            description="Update your account's profile information and appearance."
                        >
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex md:flex-row flex-col gap-4 md:items-center md:items-start">
                                        <div className="flex flex-row gap-4 items-center md:flex-col">
                                            <Avatar className="h-16 w-16 ring-2 ring-background border shrink-0">
                                                <AvatarImage src={constructImageUrl(avatarPreview)} />
                                                <AvatarFallback><User /></AvatarFallback>

                                            </Avatar>
                                            <Button type="button" variant="outline" size="sm" onClick={() => avatarInputRef.current.click()}>
                                                <Edit className="mr-2 h-3 w-3" /> Upload
                                            </Button>
                                        </div>

                                        <div className="flex-1 space-y-1 min-w-0">
                                            <p className="text-sm font-medium leading-none">Profile Picture</p>
                                            <p className="text-xs text-muted-foreground">Recommended: 400x400px</p>
                                        </div>

                                    </div>


                                    <input type="file" accept="image/*" hidden ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} />
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Banner Image</Label>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => bannerInputRef.current.click()} className="h-auto p-0 text-xs text-primary hover:bg-transparent">
                                            Change Banner
                                        </Button>
                                        <input type="file" accept="image/*" hidden ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} />
                                    </div>
                                    <div
                                        className="aspect-[16/5] w-full rounded-md bg-muted bg-cover bg-center border shadow-sm cursor-pointer transition-opacity hover:opacity-90"
                                        style={{ backgroundImage: `url(${constructImageUrl(bannerPreview) || '/placeholders/banner_placeholder.png'})` }}
                                        onClick={() => bannerInputRef.current.click()}
                                    />
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="username">Username</Label>
                                        <Input id="username" name="username" value={profileData.username} onChange={handleProfileChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="profile_slug">Profile Slug</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-mono">@</span>
                                            <Input id="profile_slug" name="profile_slug" className="pl-7" value={profileData.profile_slug || ''} onChange={handleProfileChange} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Bio</Label>
                                    <Textarea id="description" name="description" rows={4} className="resize-none" value={profileData.description || ''} onChange={handleProfileChange} placeholder="Tell us about yourself..." />
                                    <p className="text-xs text-muted-foreground text-right">Markdown supported.</p>
                                </div>

                                <TagsCombobox availableTags={availableTags} selectedTags={selectedTags} onSelectionChange={setSelectedTags} />
                            </div>
                        </SettingsSection>
                    </div>

                    <div className="lg:col-span-5 space-y-6">
                        <SettingsSection
                            title="Appearance"
                            description="Customize your profile frame."
                        >
                            <div className="flex flex-wrap gap-3">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button type="button" onClick={() => handleEquipFrame(null)} className={cn("h-14 w-14 rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105", !user.profile_frame ? "border-primary bg-primary/10" : "border-muted bg-muted/50")} disabled={isEquipping}>
                                                <X className="h-5 w-5 text-muted-foreground" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>No Frame</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                {ownedFrames.map(frame => (
                                    <TooltipProvider key={frame.item_id}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button type="button" onClick={() => handleEquipFrame(frame.item_id)} className={cn("h-14 w-14 rounded-xl border-2 relative transition-all hover:scale-105", user.profile_frame_id === frame.item_id ? "border-primary ring-2 ring-primary/20" : "border-transparent")} style={{ backgroundColor: frame.cosmetic_data?.color }} disabled={isEquipping}>
                                                    {user.profile_frame_id === frame.item_id && <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-0.5"><CheckCircle className="h-3 w-3" /></div>}
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{frame.name}</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        </SettingsSection>

                        <SettingsSection title="Integrations" description="External accounts & history.">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-card shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-[#5b8731] p-2 rounded-md text-white shadow-inner"><LinkIcon className="h-4 w-4" /></div>
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium">Minecraft</p>
                                            <p className="text-xs text-muted-foreground">{user?.minecraft_username || 'Not linked'}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" asChild><RouterLink to="/profile/link-minecraft">Manage</RouterLink></Button>
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-card shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-orange-500 p-2 rounded-md text-white shadow-inner"><History className="h-4 w-4" /></div>
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium">Purchases</p>
                                            <p className="text-xs text-muted-foreground">View history</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" asChild><RouterLink to="/profile/purchase-history">View</RouterLink></Button>
                                </div>
                            </div>
                        </SettingsSection>

                        <SettingsSection title="Notifications" description="Browser alerts.">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Push Notifications</Label>
                                    <p className="text-xs text-muted-foreground">Receive alerts on this device.</p>
                                </div>
                                <Switch checked={isSubscribed} onCheckedChange={subscribe} disabled={isSubscribed} />
                            </div>
                        </SettingsSection>

                        <Card className="bg-background">
                            <CardHeader>
                                <CardTitle>Security</CardTitle>
                                <CardDescription>Manage your password and email.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> Change Email</Label>
                                    <div className="space-y-2">
                                        {emailError && <Alert variant="destructive" className="py-2"><AlertDescription>{emailError}</AlertDescription></Alert>}
                                        <Input placeholder="New Email" name="newEmail" value={emailData.newEmail} onChange={handleEmailChange} />
                                        <Input type="password" placeholder="Current Password" name="currentPassword" value={emailData.currentPassword} onChange={handleEmailChange} />
                                        <Button onClick={handleEmailSubmit} disabled={isSavingEmail} size="sm" variant="secondary" className="w-full">
                                            {isSavingEmail && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} Request Change
                                        </Button>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-3">
                                    <Label className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Change Password</Label>
                                    <div className="space-y-2">
                                        {passwordError && <Alert variant="destructive" className="py-2"><AlertDescription>{passwordError}</AlertDescription></Alert>}
                                        <Input type="password" placeholder="Current Password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} />
                                        <Input type="password" placeholder="New Password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} />
                                        <Input type="password" placeholder="Confirm Password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} />
                                        <Button onClick={handlePasswordSubmit} disabled={isSavingPassword} size="sm" variant="secondary" className="w-full">
                                            {isSavingPassword && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} Update Password
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>

            <ImageCropperModal open={cropperOpen} onClose={() => setCropperOpen(false)} imageSrc={imageToCrop} onCropComplete={handleCropComplete} aspect={cropAspect} />
        </div>
    );
}

export default SettingsPage;