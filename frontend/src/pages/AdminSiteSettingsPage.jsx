
import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from '@/components/ui/separator';
import { Loader2, Palette, Sparkles, Sun, Sunset, Upload, Image as ImageIcon, Save } from 'lucide-react';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { constructImageUrl } from '../utils/url';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';

const colorPresets = [
    { name: 'Flame Orange', color: '#FF4D00', icon: <Sunset className="h-4 w-4" /> },
    { name: 'Sky Blue', color: '#0369A1', icon: <Sun className="h-4 w-4" /> },
    { name: 'Magic Purple', color: '#8B5CF6', icon: <Sparkles className="h-4 w-4" /> },
];

const SettingsSection = ({ title, description, children }) => (
    <div className="p-6  bg-background rounded-xl border shadow-sm">
        <div className="mb-6">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="space-y-6 pl-1">
            {children}
        </div>
        <Separator className="mt-8 bg-border/40" />
    </div>
);

function AdminSiteSettingsPage() {
    const { settings: initialSettings, refetchSettings } = useSettings();
    const { authToken } = useAuth();
    const { setBreadcrumbs } = useBreadcrumbs();


    const [formData, setFormData] = useState({ site_name: '', accent_color: '', logo_url: '', favicon_url: '' });
    const [logoFile, setLogoFile] = useState(null);
    const [faviconFile, setFaviconFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [faviconPreview, setFaviconPreview] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const logoInputRef = useRef(null);
    const faviconInputRef = useRef(null);


    useEffect(() => {
        setBreadcrumbs([
            { label: 'Admin Panel' },
            { label: 'Site Settings' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    useEffect(() => {
        if (initialSettings) {
            setFormData({
                site_name: initialSettings.site_name,
                accent_color: initialSettings.accent_color,
                logo_url: initialSettings.logo_url,
                favicon_url: initialSettings.favicon_url,
            });
            setLogoPreview(initialSettings.logo_url);
            setFaviconPreview(initialSettings.favicon_url);
        }
    }, [initialSettings]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handlePresetClick = (color) => setFormData({ ...formData, accent_color: color });

    const handleFileChange = (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        if (type === 'logo') {
            setLogoFile(file);
            setLogoPreview(previewUrl);
        } else {
            setFaviconFile(file);
            setFaviconPreview(previewUrl);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let finalLogoUrl = formData.logo_url;
            let finalFaviconUrl = formData.favicon_url;
            const headers = { headers: { Authorization: `Bearer ${authToken}` } };

            if (logoFile) {
                const logoFormData = new FormData();
                logoFormData.append('file', logoFile);
                const res = await axios.post('/api/media/site-asset', logoFormData, headers);
                finalLogoUrl = res.data.url;
            }
            if (faviconFile) {
                const faviconFormData = new FormData();
                faviconFormData.append('file', faviconFile);
                const res = await axios.post('/api/media/site-asset', faviconFormData, headers);
                finalFaviconUrl = res.data.url;
            }

            const payload = {
                ...formData,
                logo_url: finalLogoUrl,
                favicon_url: finalFaviconUrl
            };

            await axios.patch('/api/admin/settings', payload, headers);

            await refetchSettings();
            toast.success('Settings saved successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className=" w-full">
            {}
            <div className="flex flex-col sm:flex-col items-start gap-4 mb-8">
                <div>
                    <h1 className="font-sans text-3xl font-bold">Site Settings</h1>
                    <p className="text-muted-foreground mt-1 text-base">Configure global website appearance and branding.</p>
                </div>
                <Button type="submit" disabled={isSaving} size="lg" className="shrink-0">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                </Button>
            </div>

            {}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <SettingsSection title="General & Branding" description="Set the name and logos for your site."  >
                    <div className="space-y-2 ">
                        <Label htmlFor="site_name">Site Name</Label>
                        <Input id="site_name" name="site_name" value={formData.site_name} onChange={handleChange} className="max-w-md" />
                    </div>

                    <div className="flex-col flex gap-8 pt-4">
                        <div className="space-y-3">
                            <Label>Site Logo</Label>
                            <div className="flex items-center gap-4">
                                <div className="h-20 w-20 flex items-center justify-center rounded-md border bg-muted/50">
                                    {logoPreview ? (
                                        <img src={constructImageUrl(logoPreview)} alt="Logo" className="max-h-16 max-w-16 object-contain" />
                                    ) : (
                                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current.click()}>
                                        <Upload className="mr-2 h-4 w-4" /> Upload Logo
                                    </Button>
                                    <p className="text-xs text-muted-foreground">Recommended: PNG, SVG</p>
                                </div>
                                <input type="file" ref={logoInputRef} hidden accept="image/png, image/jpeg, image/svg+xml" onChange={(e) => handleFileChange(e, 'logo')} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Favicon</Label>
                            <div className="flex items-center gap-4">
                                <div className="h-20 w-20 flex items-center justify-center rounded-md border bg-muted/50">
                                    {faviconPreview ? (
                                        <img src={constructImageUrl(faviconPreview)} alt="Favicon" className="h-10 w-10 object-contain" />
                                    ) : (
                                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => faviconInputRef.current.click()}>
                                        <Upload className="mr-2 h-4 w-4" /> Upload Favicon
                                    </Button>
                                    <p className="text-xs text-muted-foreground">Recommended: ICO, PNG 32x32</p>
                                </div>
                                <input type="file" ref={faviconInputRef} hidden accept="image/x-icon, image/png, image/svg+xml" onChange={(e) => handleFileChange(e, 'favicon')} />
                            </div>
                        </div>
                    </div>
                </SettingsSection>

                <SettingsSection title="Appearance" description="Customize the accent color used throughout the site.">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Accent Color</Label>
                            <div className="flex items-center gap-4">
                                <div className="relative h-10 w-24">
                                    <div className="absolute inset-0 rounded-md border shadow-sm" style={{ backgroundColor: formData.accent_color }} />
                                    <Input type="color" name="accent_color" value={formData.accent_color} onChange={handleChange} className="h-full w-full cursor-pointer p-0 opacity-0" />
                                </div>
                                <Input
                                    value={formData.accent_color}
                                    onChange={handleChange}
                                    name="accent_color"
                                    className="w-32 font-mono"
                                    maxLength={7}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Presets</Label>
                            <div className="flex flex-wrap gap-3">
                                {colorPresets.map(preset => (
                                    <Button
                                        key={preset.name}
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            "flex items-center gap-2",
                                            formData.accent_color === preset.color && "border-primary bg-primary/5"
                                        )}
                                        onClick={() => handlePresetClick(preset.color)}
                                    >
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: preset.color }} />
                                        {preset.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </SettingsSection>
            </div>
        </form>
    );
}

export default AdminSiteSettingsPage;