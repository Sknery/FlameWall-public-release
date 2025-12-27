

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useBreadcrumbs } from '../context/BreadcrumbsContext';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Loader2, Terminal, Plus, Edit, Trash2, Check, X, Shield, Settings,
    FileText, ShieldAlert, Mail, Users, Palette, Image as ImageIcon,
    UserX, Gavel, KeyRound, UserPlus, User
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from '../hooks/useMediaQuery';


import ConfirmationModal from '../components/ConfirmationModal';
import { constructImageUrl } from '../utils/url';
import ImageCropperModal from '../components/ImageCropperModal';
import TransferOwnershipModal from '../components/TransferOwnershipModal';



function isColorLight(hexColor) {
    if (!hexColor) return false;
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return ((r * 299) + (g * 587) + (b * 114)) / 1000 > 155;
}



const ClanWarningsList = ({ warnings, clanId, onWarningDeleted }) => {
    const { authToken } = useAuth();
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [warningToDelete, setWarningToDelete] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const handleOpenDeleteModal = (warning) => {
        setWarningToDelete(warning);
        setConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!warningToDelete) return;
        setIsActionLoading(true);
        try {
            await axios.delete(`/api/clans/${clanId}/members/warnings/${warningToDelete.id}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success('Warning has been revoked.');
            onWarningDeleted();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to revoke warning.');
        } finally {
            setIsActionLoading(false);
            setConfirmModalOpen(false);
        }
    };


    if (!warnings || warnings.length === 0) {
        return (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No warnings have been issued in this clan.</CardContent></Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Issued Warnings ({warnings.length})</CardTitle>
                    <CardDescription>A log of all warnings given to members.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {warnings.map((warning) => (
                            <Card key={warning.id} className="bg-muted/50">
                                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
                                    <div className="flex items-start gap-4">
                                        <Avatar>
                                            <AvatarImage src={constructImageUrl(warning.target.pfp_url)} />
                                            <AvatarFallback>
                                                <User className="h-[60%] w-[60%]" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="text-sm">
                                                <RouterLink to={`/users/${warning.actor.profile_slug || warning.actor.id}`} className="font-semibold hover:underline">{warning.actor.username}</RouterLink>
                                                {' '}warned{' '}
                                                <RouterLink to={`/users/${warning.target.profile_slug || warning.target.id}`} className="font-semibold hover:underline">{warning.target.username}</RouterLink>
                                            </p>
                                            <p className="text-xs text-muted-foreground">{new Date(warning.created_at).toLocaleString()}</p>
                                            <blockquote className="mt-2 border-l-2 pl-3 text-sm italic">"{warning.reason}"</blockquote>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleOpenDeleteModal(warning)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <ConfirmationModal open={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} onConfirm={handleConfirmDelete} title="Confirm Warning Revoke" content={`Are you sure you want to revoke this warning for "${warningToDelete?.target.username}"? This action cannot be undone.`} confirmText="Revoke" confirmColor="destructive" loading={isActionLoading} />
        </>
    );
};

const ClanInvitationsManager = ({ invitations, clanId, onInviteCancelled }) => {
    const { authToken } = useAuth();
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [inviteToCancel, setInviteToCancel] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const handleOpenCancelModal = (invite) => {
        setInviteToCancel(invite);
        setConfirmModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!inviteToCancel) return;
        setIsActionLoading(true);
        try {
            await axios.delete(`/api/clans/${clanId}/invitations/${inviteToCancel.id}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success(`Invitation for ${inviteToCancel.invitee.username} cancelled.`);
            onInviteCancelled();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel invitation.');
        } finally {
            setIsActionLoading(false);
            setConfirmModalOpen(false);
        }
    };

    if (!invitations || invitations.length === 0) {
        return (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No pending invitations.</CardContent></Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Sent Invitations ({invitations.length})</CardTitle>
                    <CardDescription>These invitations have been sent but not yet accepted or declined.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {invitations.map((invite) => (
                            <Card key={invite.id} className="bg-muted/50">
                                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={constructImageUrl(invite.invitee.pfp_url)} />
                                            <AvatarFallback>
                                                <User className="h-[60%] w-[60%]" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm">
                                                Invitation sent to{' '}
                                                <RouterLink to={`/users/${invite.invitee.profile_slug || invite.invitee.id}`} className="font-semibold hover:underline">{invite.invitee.username}</RouterLink>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                by {invite.inviter.username} ・ Expires {formatDistanceToNow(new Date(invite.expires_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => handleOpenCancelModal(invite)}>
                                        Cancel Invite
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <ConfirmationModal
                open={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleConfirmCancel}
                title="Confirm Cancellation"
                content={`Are you sure you want to cancel the invitation for "${inviteToCancel?.invitee.username}"?`}
                confirmText="Cancel Invite"
                confirmColor="destructive"
                loading={isActionLoading}
            />
        </>
    );
};


const SettingsPanel = ({ clan, details, setDetails, onDetailsSave, onTemplateSave, template, setTemplate, isSavingDetails, isSavingTemplate, authToken, onTransferOwnership }) => {
    const iconInputRef = useRef(null);
    const bannerInputRef = useRef(null);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);
    const [cropAspect, setCropAspect] = useState(1);
    const [cropType, setCropType] = useState('icon');
    const { user: currentUser } = useAuth();

    const handleDetailsChange = (e) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
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

    const handleCropComplete = async (croppedImageBlob) => {
        if (!croppedImageBlob) {
            setCropperOpen(false);
            return;
        }
        const endpoint = cropType === 'icon' ? '/api/media/clan-icon' : '/api/media/clan-banner';
        const formData = new FormData();
        formData.append('file', croppedImageBlob, `${cropType}.png`);
        const toastId = toast.loading(`Uploading ${cropType}...`);
        try {
            const response = await axios.post(endpoint, formData, { headers: { Authorization: `Bearer ${authToken}` } });
            const fieldToUpdate = cropType === 'icon' ? 'card_icon_url' : 'card_image_url';
            setDetails(prev => ({ ...prev, [fieldToUpdate]: response.data.url }));
            toast.success(`${cropType.charAt(0).toUpperCase() + cropType.slice(1)} updated!`, { id: toastId });
        } catch (err) {
            toast.error(`Failed to upload ${cropType}.`, { id: toastId });
        } finally {
            setCropperOpen(false);
            setImageToCrop(null);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 @md:grid-cols-12 gap-6">
                <div className="@md:col-span-7 space-y-6">
                    <form onSubmit={onDetailsSave}>
                        <Card>
                            <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2"><Label>Description</Label><Textarea name="description" value={details.description} onChange={handleDetailsChange} rows={3} /></div>
                                <div className="space-y-2"><Label>Join Method</Label>
                                    <Select value={details.join_type} onValueChange={(val) => setDetails(p => ({ ...p, join_type: val }))}><SelectTrigger><SelectValue placeholder="Select method..." /></SelectTrigger>
                                        <SelectContent><SelectItem value="closed">Closed (Invite Only)</SelectItem><SelectItem value="application">By Application</SelectItem><SelectItem value="open">Open to Everyone</SelectItem></SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter><Button type="submit" disabled={isSavingDetails}>{isSavingDetails && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Details</Button></CardFooter>
                        </Card>
                    </form>

                    <Card>
                        <CardHeader><CardTitle>Application Form Builder</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {template.map((field, index) => (
                                <div key={index} className="flex items-end gap-2">
                                    <div className="flex-1 space-y-1.5">
                                        <Label htmlFor={`field-${index}`}>Field #{index + 1} Label</Label>
                                        <Input id={`field-${index}`} value={field.label} onChange={(e) => { const newTemplate = [...template]; newTemplate[index].label = e.target.value; setTemplate(newTemplate); }} placeholder="e.g., Your age" />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => setTemplate(template.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="flex-col items-start gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setTemplate([...template, { label: '', type: 'text' }])}><Plus className="mr-2 h-4 w-4" />Add Field</Button>
                            <Button type="button" onClick={onTemplateSave} disabled={isSavingTemplate}>{isSavingTemplate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Template</Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="md:col-span-5 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label>Clan Banner</Label>
                                <div className="aspect-[16/5] w-full rounded-md bg-muted bg-cover bg-center" style={{ backgroundImage: `url(${constructImageUrl(details.card_image_url) || '/placeholders/banner_placeholder.png'})` }} />
                                <Button type="button" variant="outline" onClick={() => bannerInputRef.current.click()} className="w-fit"><ImageIcon className="mr-2 h-4 w-4" />Change Banner</Button>
                                <input type="file" ref={bannerInputRef} hidden accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                            </div>
                            <div className="space-y-2"><Label>Clan Icon</Label>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20"><AvatarImage src={constructImageUrl(details.card_icon_url)} /><AvatarFallback><Shield className="h-10 w-10" /></AvatarFallback></Avatar>
                                    <Button type="button" variant="outline" onClick={() => iconInputRef.current.click()} className="w-fit"><ImageIcon className="mr-2 h-4 w-4" />Change Icon</Button>
                                    <input type="file" ref={iconInputRef} hidden accept="image/*" onChange={(e) => handleFileChange(e, 'icon')} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {currentUser?.id === clan.owner_id && (
                <div className="md:col-span-12 mt-6">
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                            <CardDescription>These actions are irreversible. Please proceed with caution.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">Transfer Ownership</p>
                                    <p className="text-sm text-muted-foreground">Transfer this clan to another member.</p>
                                </div>
                                <Button variant="destructive" onClick={onTransferOwnership}>Transfer...</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <ImageCropperModal open={cropperOpen} onClose={() => setCropperOpen(false)} imageSrc={imageToCrop} onCropComplete={handleCropComplete} aspect={cropAspect} />
        </>
    );
};

const ClanRoleManager = ({ clan, onRolesUpdate }) => {
    const { authToken, user: currentUser } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [modalError, setModalError] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', color: '#AAAAAA', power_level: 10, clanPermissions: {}, memberPermissions: {} });

    const isMobile = useMediaQuery('(max-width:768px)');
    const sortedRoles = [...clan.roles].sort((a, b) => b.power_level - a.power_level);
    const currentUserRole = clan.members.find(m => m.user_id === currentUser.id)?.role;

    const getInitialFormData = () => ({
        name: '', color: '#AAAAAA', power_level: 10,
        clanPermissions: { canEditDetails: false, canEditAppearance: false, canEditRoles: false, canEditApplicationForm: false, canAcceptMembers: false, canInviteMembers: false, canUseClanTags: false, canAccessAdminChat: false },
        memberPermissions: { maxKickPower: 0, maxMutePower: 0, maxPromotePower: 0, maxDemotePower: 0, maxWarnPower: 0 }
    });

    const handleOpenEditModal = (role = null) => {
        setModalError('');
        if (role) {
            setEditingRole(role);
            const initialData = getInitialFormData();
            setFormData({
                name: role.name, color: role.color, power_level: role.power_level,
                clanPermissions: { ...initialData.clanPermissions, ...role.permissions?.clanPermissions },
                memberPermissions: { ...initialData.memberPermissions, ...role.permissions?.memberPermissions },
            });
        } else {
            setEditingRole(null);
            setFormData(getInitialFormData());
        }
        setIsEditModalOpen(true);
    };

    const handlePermissionChange = useCallback((permissionType, key, value) => {
        setFormData(prev => ({ ...prev, [permissionType]: { ...prev[permissionType], [key]: value, } }));
    }, []);

    const handleFormFieldChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSaveRole = async (event) => {
        event.preventDefault();
        setIsActionLoading(true);
        setModalError('');
        let payload = { ...formData };
        if (editingRole?.is_system_role) {
            payload = { name: formData.name, color: formData.color };
        }
        const apiCall = editingRole ? axios.patch(`/api/clans/${clan.id}/roles/${editingRole.id}`, payload, { headers: { Authorization: `Bearer ${authToken}` } }) : axios.post(`/api/clans/${clan.id}/roles`, payload, { headers: { Authorization: `Bearer ${authToken}` } });
        try {
            await apiCall;
            toast.success(`Role successfully ${editingRole ? 'updated' : 'created'}!`);
            onRolesUpdate();
            setIsEditModalOpen(false);
        } catch (err) {
            const message = err.response?.data?.message;
            setModalError(Array.isArray(message) ? message.join(', ') : (message || 'An error occurred.'));
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleOpenDeleteConfirm = (role) => {
        setRoleToDelete(role);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!roleToDelete) return;
        setIsActionLoading(true);
        try {
            await axios.delete(`/api/clans/${clan.id}/roles/${roleToDelete.id}`, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success(`Role "${roleToDelete.name}" was deleted.`);
            onRolesUpdate();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete role.');
        } finally {
            setIsActionLoading(false);
            setIsConfirmModalOpen(false);
        }
    };

    const RoleCard = ({ role, memberCount }) => (
        <Card>
            <CardContent className="flex items-center justify-between p-4">
                <div>
                    <Badge style={{ backgroundColor: role.color, color: isColorLight(role.color) ? '#000' : '#FFF' }}>{role.name}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                        Power: {role.power_level} &bull; Members: {memberCount}
                    </p>
                </div>
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditModal(role)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={role.is_system_role} onClick={() => handleOpenDeleteConfirm(role)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Role Management</CardTitle>
                    <CardDescription>Define permissions for your clan members.</CardDescription>
                </div>
                <Button onClick={() => handleOpenEditModal()}><Plus className="mr-2 h-4 w-4" /> Create Role</Button>
            </CardHeader>
            <CardContent>
                {isMobile ? (
                    <div className="space-y-3">
                        {sortedRoles.map((role) => {
                            const memberCount = clan.members.filter(m => m.role_id === role.id).length;
                            return <RoleCard key={role.id} role={role} memberCount={memberCount} />
                        })}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role</TableHead>
                                <TableHead className="w-[120px]">Power Level</TableHead>
                                <TableHead className="w-[120px]">Members</TableHead>
                                <TableHead>Key Permissions</TableHead>
                                <TableHead className="text-right w-[120px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedRoles.map((role) => {
                                const memberCount = clan.members.filter(m => m.role_id === role.id).length;
                                const permissions = role.permissions || { clanPermissions: {}, memberPermissions: {} };
                                const { clanPermissions, memberPermissions } = permissions;

                                return (
                                    <TableRow key={role.id}>
                                        <TableCell>
                                            <Badge style={{ backgroundColor: role.color, color: isColorLight(role.color) ? '#000' : '#FFF' }}>
                                                {role.name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{role.power_level}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                {memberCount}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <TooltipProvider delayDuration={100}>
                                                <div className="flex items-center gap-3">
                                                    {clanPermissions?.canEditDetails && (
                                                        <Tooltip><TooltipTrigger asChild><Edit className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Can Edit Clan Details</p></TooltipContent></Tooltip>
                                                    )}
                                                    {clanPermissions?.canInviteMembers && (
                                                        <Tooltip><TooltipTrigger asChild><UserPlus className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Can Invite Members</p></TooltipContent></Tooltip>
                                                    )}
                                                    {clanPermissions?.canAccessAdminChat && (
                                                        <Tooltip><TooltipTrigger asChild><Shield className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Can Access Admin Chat</p></TooltipContent></Tooltip>
                                                    )}
                                                    {(memberPermissions?.maxKickPower > 0 || memberPermissions?.maxMutePower > 0 || memberPermissions?.maxWarnPower > 0) && (
                                                        <Tooltip><TooltipTrigger asChild><Gavel className="h-4 w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Has Moderation Powers</p></TooltipContent></Tooltip>
                                                    )}
                                                </div>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditModal(role)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={role.is_system_role} onClick={() => handleOpenDeleteConfirm(role)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent 
                    className="sm:max-w-[625px]"
                    onOpenAutoFocus={(e) => {
                        e.preventDefault();
                    }}
                >
                    <DialogHeader><DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle></DialogHeader>
                    {modalError && <Alert variant="destructive" className="my-4"><Terminal className="h-4 w-4" /><AlertDescription>{modalError}</AlertDescription></Alert>}
                    <form onSubmit={handleSaveRole} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2 col-span-2"><Label>Role Name</Label><Input name="name" value={formData.name} onChange={(e) => handleFormFieldChange('name', e.target.value)} required /></div>
                            <div className="space-y-2"><Label>Color</Label><Input name="color" type="color" value={formData.color} onChange={(e) => handleFormFieldChange('color', e.target.value)} className="p-1 h-9" /></div>
                        </div>
                        <div className="space-y-2"><Label>Power Level</Label><Input name="power_level" type="number" value={formData.power_level} onChange={(e) => handleFormFieldChange('power_level', parseInt(e.target.value, 10) || 0)} disabled={!!editingRole?.is_system_role} required /><p className="text-xs text-muted-foreground">1-999. Higher is more powerful.</p></div>
                        <Separator />
                        <h4 className="font-semibold">Clan Permissions</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.keys(formData.clanPermissions).map(key => (
                                <div key={key} className="flex items-center justify-between"><Label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Label><Switch checked={formData.clanPermissions[key]} onCheckedChange={(val) => handlePermissionChange('clanPermissions', key, val)} disabled={!!editingRole?.is_system_role} /></div>
                            ))}
                        </div>
                        <Separator />
                        <h4 className="font-semibold">Member Permissions</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.keys(formData.memberPermissions).map(key => (
                                <div key={key} className="space-y-2"><Label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Label>
                                    <Select value={String(formData.memberPermissions[key])} onValueChange={(val) => handlePermissionChange('memberPermissions', key, Number(val))} disabled={!!editingRole?.is_system_role}>
                                        <SelectTrigger><SelectValue placeholder="Select power level..." /></SelectTrigger>
                                        <SelectContent><SelectItem value="0">None (0)</SelectItem>
                                            {sortedRoles.filter(r => r.power_level < formData.power_level && r.power_level < (currentUserRole?.power_level || 1000)).map(r => (
                                                <SelectItem key={r.id} value={String(r.power_level)}>{r.name} ({r.power_level})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                        <DialogFooter><Button type="submit" disabled={isActionLoading}>{isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <ConfirmationModal open={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmDelete} title="Confirm Role Deletion" content={`Are you sure you want to delete the role "${roleToDelete?.name}"?`} confirmText="Delete" confirmColor="destructive" loading={isActionLoading} />
        </Card>
    );
};

const ClanApplicationsList = ({ applications, onUpdate }) => {
    const { authToken } = useAuth();
    const [loadingAction, setLoadingAction] = useState(null);

    const handleProcessApplication = async (applicationId, status) => {
        setLoadingAction(applicationId);
        try {
            await axios.patch(`/api/clans/applications/${applicationId}/handle`, { status }, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success(`Application has been ${status}.`);
            onUpdate();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Action failed.');
        } finally {
            setLoadingAction(null);
        }
    };

    if (!applications || applications.length === 0) {
        return <Card><CardContent className="p-6 text-center text-muted-foreground">There are no pending applications.</CardContent></Card>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Applications ({applications.length})</CardTitle>
                <CardDescription>Review and process applications from players who want to join.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {applications.map(app => (
                    <Card key={app.id} className="bg-muted/50">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <Avatar><AvatarImage src={constructImageUrl(app.user.pfp_url)} /><AvatarFallback>
                                        <User className="h-[60%] w-[60%]" />
                                    </AvatarFallback></Avatar>
                                    <div><p className="font-semibold">{app.user.username}</p><p className="text-xs text-muted-foreground">Applied on {new Date(app.created_at).toLocaleDateString()}</p></div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button size="sm" className="flex-1" onClick={() => handleProcessApplication(app.id, 'accepted')} disabled={loadingAction === app.id}>{loadingAction === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Accept</Button>
                                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleProcessApplication(app.id, 'rejected')} disabled={loadingAction === app.id}><X className="mr-2 h-4 w-4" />Reject</Button>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                {Object.entries(app.answers).map(([question, answer]) => (
                                    <div key={question}><p className="text-xs font-semibold text-muted-foreground">{question}</p><p className="text-sm">{String(answer)}</p></div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </CardContent>
        </Card>
    );
};


function ManageClanPage() {

    const { tag } = useParams();
    const { authToken, user: currentUser } = useAuth();
    const navigate = useNavigate();
    const { setBreadcrumbs } = useBreadcrumbs();
    const [clan, setClan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [details, setDetails] = useState({});
    const [template, setTemplate] = useState([]);
    const [applications, setApplications] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [isSavingDetails, setIsSavingDetails] = useState(false);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [activeTab, setActiveTab] = useState("settings");
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

    const fetchData = useCallback(async (tab) => {
        if (!authToken) return;
        try {
            if (!clan) setLoading(true);
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            let clanData = clan;

            if (!clanData) {
                const response = await axios.get(`/api/clans/${tag}/management-data`, config);
                clanData = response.data.clan;
                setClan(clanData);
                setDetails({
                    description: clanData.description || '', join_type: clanData.join_type,
                    card_image_url: clanData.card_image_url || '', card_icon_url: clanData.card_icon_url || '',
                });
                setTemplate(clanData.application_template || []);
                setApplications(response.data.applications || []);
            }

            if (tab === "warnings") {
                const warningsRes = await axios.get(`/api/clans/${clanData.id}/members/warnings`, config);
                setWarnings(warningsRes.data);
            } else if (tab === "invitations") {
                const invitesRes = await axios.get(`/api/clans/${clanData.id}/invitations/sent`, config);
                setInvitations(invitesRes.data);
            }

        } catch (err) {
            setError(err.response?.data?.message || "Failed to load management data.");
        } finally {
            setLoading(false);
        }
    }, [tag, authToken, clan]);

    useEffect(() => {
        fetchData(activeTab);
    }, [fetchData, activeTab]);

    useEffect(() => {
        if (clan) {
            setBreadcrumbs([
                { label: 'Community', link: '/clans' },
                { label: 'Clans', link: '/clans' },
                { label: clan.name, link: `/clans/${clan.tag}` },
                { label: 'Manage' }
            ]);
        }
        return () => setBreadcrumbs([]);
    }, [clan, setBreadcrumbs, tag]);

    const handleDetailsSave = async (e) => {
        e.preventDefault();
        setIsSavingDetails(true);
        try {
            await axios.patch(`/api/clans/${tag}/details`, details, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success('Clan details updated!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update details.');
        } finally {
            setIsSavingDetails(false);
        }
    };
    const handleSaveTemplate = async () => {
        setIsSavingTemplate(true);
        try {
            await axios.patch(`/api/clans/${clan.id}/settings`, { application_template: template }, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success('Application form template saved!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save template.');
        } finally {
            setIsSavingTemplate(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    if (!clan) return null;

    return (
        <div className="space-y-6">
            <h1 className="font-sans text-3xl font-bold">Manage Clan: {clan.name}</h1>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
                    <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" />Settings</TabsTrigger>
                    <TabsTrigger value="roles"><Shield className="h-4 w-4 mr-2" />Roles</TabsTrigger>
                    <TabsTrigger value="applications"><FileText className="h-4 w-4 mr-2" />Applications {applications.length > 0 && <Badge className="ml-2">{applications.length}</Badge>}</TabsTrigger>
                    <TabsTrigger value="warnings"><ShieldAlert className="h-4 w-4 mr-2" />Warnings {warnings.length > 0 && <Badge className="ml-2">{warnings.length}</Badge>}</TabsTrigger>
                    <TabsTrigger value="invitations"><Mail className="h-4 w-4 mr-2" />Invitations {invitations.length > 0 && <Badge className="ml-2">{invitations.length}</Badge>}</TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="mt-4">
                    <SettingsPanel
                        clan={clan}
                        details={details} setDetails={setDetails}
                        onDetailsSave={handleDetailsSave}
                        template={template} setTemplate={setTemplate}
                        onTemplateSave={handleSaveTemplate}
                        isSavingDetails={isSavingDetails} isSavingTemplate={isSavingTemplate}
                        authToken={authToken}
                        onTransferOwnership={() => setIsTransferModalOpen(true)}
                    />
                </TabsContent>
                <TabsContent value="roles" className="mt-4 pb-6">
                    <ClanRoleManager clan={clan} onRolesUpdate={() => fetchData(activeTab)} />
                </TabsContent>
                <TabsContent value="applications" className="mt-4 pb-6">
                    <ClanApplicationsList applications={applications} onUpdate={() => fetchData(activeTab)} />
                </TabsContent>
                <TabsContent value="warnings" className="mt-4 pb-6">
                    <ClanWarningsList warnings={warnings} clanId={clan.id} onWarningDeleted={() => fetchData(activeTab)} />
                </TabsContent>
                <TabsContent value="invitations" className="mt-4 pb-6">
                    <ClanInvitationsManager invitations={invitations} clanId={clan.id} onInviteCancelled={() => fetchData(activeTab)} />
                </TabsContent>
            </Tabs>
            {clan && (
                <TransferOwnershipModal
                    open={isTransferModalOpen}
                    onClose={() => setIsTransferModalOpen(false)}
                    clan={clan}
                    onSuccess={() => {
                        setIsTransferModalOpen(false);
                        navigate(`/clans/${clan.tag}`);
                    }}
                />
            )}
        </div>
    );
}

export default ManageClanPage;
