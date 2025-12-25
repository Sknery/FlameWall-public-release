import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, Plus, Edit, Trash2, Globe, Sparkles, Gamepad2, ShieldCheck, Crown } from 'lucide-react';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';


import ConfirmationModal from '../components/ConfirmationModal';
import { listContainer, fadeInUp } from '../utils/animations';

function isColorLight(hexColor) {
    if (!hexColor) return false;
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return ((r * 299) + (g * 587) + (b * 114)) / 1000 > 155;
}

const RankCard = ({ rank, onEdit, onDelete }) => (
    <div
        className="relative rounded-xl p-px group transition-all duration-300 h-full"
        style={{
            background: `radial-gradient(400px circle at 50% 0%, ${rank.display_color}44, transparent 70%)`,
        }}
    >
        <Card className="relative flex flex-col h-full bg-card/60 backdrop-blur-sm border-white/5 hover:border-white/10 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: rank.display_color }} />

            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <Badge
                        style={{
                            backgroundColor: rank.display_color,
                            color: isColorLight(rank.display_color) ? '#000' : '#FFF',
                            fontSize: '0.85rem',
                            boxShadow: `0 0 10px ${rank.display_color}66`
                        }}
                    >
                        {rank.name}
                    </Badge>
                    {rank.is_site_only && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger><Globe className="h-4 w-4 text-muted-foreground hover:text-blue-400 transition-colors" /></TooltipTrigger>
                                <TooltipContent><p>Site-only rank</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                <CardDescription className="font-mono text-xs mt-1 opacity-70">@{rank.system_name}</CardDescription>
            </CardHeader>

            <CardContent className="flex-grow py-6 flex flex-col items-center justify-center gap-2">
                <div className="p-3 rounded-full bg-muted/30 mb-1">
                    {rank.power_level >= 900 ? <Crown className="h-8 w-8" style={{ color: rank.display_color }} /> : <ShieldCheck className="h-8 w-8" style={{ color: rank.display_color }} />}
                </div>
                <div className="text-center">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Power Level</p>
                    <p className="text-2xl font-bold font-mono">{rank.power_level}</p>
                </div>
            </CardContent>

            <Separator className="bg-border/40" />

            <CardFooter className="p-3 flex justify-between items-center bg-muted/20">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Gamepad2 className="h-3.5 w-3.5" />
                    {rank.command_template ? 'Sync Active' : 'No Sync'}
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit(rank)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={!rank.is_removable}
                        onClick={() => onDelete(rank)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    </div>
);

function AdminRanksPage() {
    const { authToken } = useAuth();
    const [ranks, setRanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { setBreadcrumbs } = useBreadcrumbs();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRank, setEditingRank] = useState(null);
    const [formData, setFormData] = useState({ name: '', system_name: '', power_level: 10, display_color: '#808080', command_template: '', command_template_remove: '', is_site_only: false });
    const [modalError, setModalError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [rankToDelete, setRankToDelete] = useState(null);

    const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
    const [migrationRankId, setMigrationRankId] = useState('');

    const fetchRanks = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/ranks', { headers: { Authorization: `Bearer ${authToken}` } });
            setRanks(response.data.sort((a, b) => b.power_level - a.power_level));
        } catch (err) { setError('Failed to load ranks data.'); } finally { setLoading(false); }
    }, [authToken]);

    useEffect(() => { fetchRanks(); }, [fetchRanks]);

    useEffect(() => {
        setBreadcrumbs([
            { label: 'Admin Panel' },
            { label: 'Ranks' }
        ]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs]);

    const handleOpenEditModal = (rank = null) => {
        setModalError('');
        if (rank) {
            setEditingRank(rank);
            setFormData({ name: rank.name, system_name: rank.system_name, power_level: rank.power_level, display_color: rank.display_color, command_template: rank.command_template || '', command_template_remove: rank.command_template_remove || '', is_site_only: rank.is_site_only || false });
        } else {
            setEditingRank(null);
            setFormData({ name: '', system_name: '', power_level: 10, display_color: '#808080', command_template: '', command_template_remove: '', is_site_only: false });
        }
        setIsEditModalOpen(true);
    };

    const handleFormChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleColorChange = (e) => setFormData(prev => ({ ...prev, display_color: e.target.value }));

    const handleSaveRank = async (event) => {
        event.preventDefault();
        setIsSaving(true);
        setModalError('');
        const isCustomRank = !editingRank || editingRank.is_removable;
        if (isCustomRank && formData.power_level >= 800) {
            setModalError('Power level must be less than 800 for custom ranks.'); setIsSaving(false); return;
        }
        const apiCall = editingRank ? axios.patch(`/api/ranks/${editingRank.id}`, formData, { headers: { Authorization: `Bearer ${authToken}` } }) : axios.post('/api/ranks', formData, { headers: { Authorization: `Bearer ${authToken}` } });
        try {
            await apiCall;
            toast.success(`Rank successfully ${editingRank ? 'updated' : 'created'}!`);
            fetchRanks();
            setIsEditModalOpen(false);
        } catch (err) { setModalError(err.response?.data?.message || 'An error occurred.'); } finally { setIsSaving(false); }
    };

    const handleOpenDeleteConfirm = (rank) => { setRankToDelete(rank); setIsConfirmModalOpen(true); };

    const handleConfirmDelete = async () => {
        if (!rankToDelete) return;
        setIsConfirmModalOpen(false);
        setIsSaving(true);
        try {
            await axios.delete(`/api/ranks/${rankToDelete.id}`, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success(`Rank "${rankToDelete.name}" was deleted.`);
            fetchRanks();
        } catch (err) {
            if (err.response && err.response.status === 409) {
                setModalError(err.response.data.message);
                setIsMigrationModalOpen(true);
            } else { toast.error(err.response?.data?.message || 'Failed to delete rank.'); }
        } finally { setIsSaving(false); }
    };

    const handleConfirmDeleteWithMigration = async () => {
        if (!rankToDelete || !migrationRankId) { setModalError('You must select a rank to migrate users to.'); return; }
        setIsSaving(true);
        try {
            await axios.delete(`/api/ranks/${rankToDelete.id}`, { headers: { Authorization: `Bearer ${authToken}` }, data: { migrationRankId: Number(migrationRankId) } });
            toast.success('Rank deleted and users migrated successfully.');
            setIsMigrationModalOpen(false);
            setRankToDelete(null);
            setMigrationRankId('');
            setModalError('');
            fetchRanks();
        } catch (err) { setModalError(err.response?.data?.message || 'An error occurred during migration.'); } finally { setIsSaving(false); }
    };

    if (loading) return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="font-sans text-3xl font-bold">Rank Management</h1>
                <Button onClick={() => handleOpenEditModal()}><Plus className="mr-2 h-4 w-4" /> Create Rank</Button>
            </div>

            <motion.div
                variants={listContainer}
                initial="initial"
                animate="animate"
                className="responsive-grid"            >
                {ranks.map((rank) => (
                    <motion.div key={rank.id} variants={fadeInUp} className="h-full">
                        <RankCard
                            rank={rank}
                            onEdit={handleOpenEditModal}
                            onDelete={handleOpenDeleteConfirm}
                        />
                    </motion.div>
                ))}
            </motion.div>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>{editingRank ? 'Edit Rank' : 'Create New Rank'}</DialogTitle>
                        <DialogDescription>
                            Configure the rank's appearance, permissions, and in-game integration.
                        </DialogDescription>
                    </DialogHeader>

                    {modalError && <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertDescription>{modalError}</AlertDescription></Alert>}

                    <form id="rank-form" onSubmit={handleSaveRank} className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Display Name</Label>
                                    <Input id="name" name="name" value={formData.name} onChange={handleFormChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="system_name">System Name</Label>
                                    <Input id="system_name" name="system_name" value={formData.system_name} onChange={handleFormChange} required />
                                    <p className="text-xs text-muted-foreground">Internal name for game sync (e.g., `vip`, `moderator`).</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="power_level">Power Level</Label>
                                    <Input id="power_level" name="power_level" type="number" value={formData.power_level} onChange={handleFormChange} disabled={editingRank && !editingRank.is_removable} required />
                                    <p className="text-xs text-muted-foreground">Determines hierarchy. 1-999. Higher is more powerful.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Live Preview</Label>
                                    <Card className="p-4 flex items-center justify-center bg-muted/50 h-24">
                                        <Badge style={{
                                            backgroundColor: formData.display_color,
                                            color: isColorLight(formData.display_color) ? '#000' : '#FFF',
                                            fontSize: '1rem',
                                            padding: '0.5rem 1rem'
                                        }}>
                                            {formData.name || 'Rank Name'}
                                        </Badge>
                                    </Card>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="display_color">Display Color</Label>
                                    <div className="flex gap-2 items-center">
                                        <Input id="display_color" name="display_color" type="color" value={formData.display_color} onChange={handleColorChange} className="p-1 h-10 w-14 shrink-0 cursor-pointer" />
                                        <Input value={formData.display_color} onChange={handleColorChange} name="display_color" className="font-mono" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator/>

                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2"><Gamepad2 className="h-5 w-5 text-primary" /> Game Integration</h3>
                            <div className="space-y-2">
                                <Label htmlFor="command_template">Issue Command Template</Label>
                                <Input id="command_template" name="command_template" value={formData.command_template} onChange={handleFormChange} placeholder="lp user {username} parent set ..." />
                                <p className="text-xs text-muted-foreground">The command to run in-game to grant this rank. Use `{'{username}'}` as a placeholder.</p>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="command_template_remove">Remove Command Template</Label>
                                <Input id="command_template_remove" name="command_template_remove" value={formData.command_template_remove} onChange={handleFormChange} placeholder="lp user {username} parent remove ..." />
                                <p className="text-xs text-muted-foreground">Optional. Command to run when a user is moved to the Default rank from this one.</p>
                            </div>
                        </div>

                        <Separator/>

                        <div className="space-y-4">
                             <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Website Behavior</h3>
                             <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label>Site-Only Rank</Label>
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        Prevent this rank from being overwritten by in-game rank sync.
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.is_site_only}
                                    onCheckedChange={(checked) => setFormData(prev => ({...prev, is_site_only: checked}))}
                                />
                            </div>
                        </div>
                    </form>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button type="submit" form="rank-form" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingRank ? 'Save Changes' : 'Create Rank'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {}
            <Dialog open={isMigrationModalOpen} onOpenChange={setIsMigrationModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Delete Rank: {rankToDelete?.name}</DialogTitle><DialogDescription>{modalError}</DialogDescription></DialogHeader>
                    <div className="py-4 space-y-2"><Label htmlFor="migration-rank">Migrate Users To</Label>
                        <Select onValueChange={setMigrationRankId}><SelectTrigger id="migration-rank"><SelectValue placeholder="Select a new rank..." /></SelectTrigger>
                            <SelectContent>{ranks.filter(r => r.id !== rankToDelete?.id).map(rank => <SelectItem key={rank.id} value={String(rank.id)}>{rank.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <DialogFooter><Button variant="destructive" onClick={handleConfirmDeleteWithMigration} disabled={!migrationRankId || isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm & Migrate</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {}
            <ConfirmationModal open={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmDelete} title="Confirm Deletion" content={`Are you sure you want to delete the rank "${rankToDelete?.name}"?`} confirmText="Delete" confirmColor="destructive" loading={isSaving} />
        </div>
    );
}

export default AdminRanksPage;