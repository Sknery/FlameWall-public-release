import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, Link as LinkIcon, Link2, Copy, CheckCircle, ShieldCheck } from 'lucide-react';


import ConfirmationModal from '../components/ConfirmationModal';

function LinkMinecraftPage() {
    const { user, authToken, updateAuthToken } = useAuth();
    const { setBreadcrumbs } = useBreadcrumbs();
    const [code, setCode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUnlinking, setIsUnlinking] = useState(false);

    useEffect(() => {
        setBreadcrumbs([
            { label: 'My Profile', link: '/profile/me' },
            { label: 'Settings', link: '/profile/settings' },
            { label: 'Link Minecraft' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    const handleGenerateCode = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('/api/linking/generate-code', {}, { headers: { Authorization: `Bearer ${authToken}` } });
            setCode(response.data.code);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate code.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        const command = `/link ${code}`;
        navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleUnlink = async () => {
        setIsUnlinking(true);
        try {
            const response = await axios.post('/api/users/me/unlink-minecraft', {}, { headers: { Authorization: `Bearer ${authToken}` } });
            updateAuthToken(response.data.access_token);
            toast.success('Minecraft account unlinked successfully!');
            setIsModalOpen(false);
            setCode(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to unlink account.');
        } finally {
            setIsUnlinking(false);
        }
    };

    if (user && user.minecraft_username) {
        return (
            <div className="space-y-6">
                <h1 className="font-sans text-3xl font-bold">Minecraft Account</h1>
                <Card className="border-green-500/50">
                    <CardHeader className="text-center">
                        <ShieldCheck className="mx-auto h-12 w-12 text-green-500" />
                        <CardTitle className="mt-2">Account Linked!</CardTitle>
                        <CardDescription>
                            Your website account is linked to the Minecraft account: <br />
                            <strong className="text-foreground">{user.minecraft_username}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button variant="destructive" onClick={() => setIsModalOpen(true)}>
                            <Link2 className="mr-2 h-4 w-4" /> Unlink Account
                        </Button>
                    </CardContent>
                </Card>
                <ConfirmationModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleUnlink}
                    title="Confirm Unlink"
                    content="Are you sure you want to unlink your Minecraft account? You will need to generate a new code to link it again."
                    confirmText="Unlink"
                    confirmColor="destructive"
                    loading={isUnlinking}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="font-sans text-3xl font-bold">Link your Minecraft Account</h1>
            <p className="text-muted-foreground">
                Connect your website profile to your in-game account to sync your status, friends, and more.
            </p>
            {error && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            <Card className="text-center">
                <CardContent className="p-6">
                    {code ? (
                        <div className="space-y-4">
                            <div>
                                <p>1. Log in to our Minecraft server.</p>
                                <p>2. Type this command in the in-game chat:</p>
                            </div>
                            <div className="relative">
                                <Input readOnly value={`/link ${code}`} className="pr-12 text-center font-mono text-lg" />
                                <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={handleCopy}>
                                    {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">This code will expire in 5 minutes.</p>
                        </div>
                    ) : (
                        <Button size="lg" onClick={handleGenerateCode} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Generate one-time code
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default LinkMinecraftPage;
