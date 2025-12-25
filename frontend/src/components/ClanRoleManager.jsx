

import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    Button
} from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Loader2, Terminal, Plus, Edit, Trash2, Shield, Users, UserPlus, Gavel
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from '../hooks/useMediaQuery';

import ConfirmationModal from './ConfirmationModal';
import toast from 'react-hot-toast';

function isColorLight(hexColor) {
    if (!hexColor) return false;
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return ((r * 299) + (g * 587) + (b * 114)) / 1000 > 155;
}

const ClanRoleManager = ({ clan, onRolesUpdate }) => {
    const { authToken, user: currentUser } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [modalError, setModalError] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', color: '#AAAAAA', power_level: 10, clanPermissions: {}, memberPermissions: {} });

    const isMobile = useMediaQuery('(max-width: 768px)');    const sortedRoles = [...clan.roles].sort((a, b) => b.power_level - a.power_level);
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

    const handlePermissionChange = (permissionType, key, value) => {
        setFormData(prev => ({ ...prev, [permissionType]: { ...prev[permissionType], [key]: value, } }));
    };

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
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader><DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle></DialogHeader>
                    {modalError && <Alert variant="destructive" className="my-4"><Terminal className="h-4 w-4" /><AlertDescription>{modalError}</AlertDescription></Alert>}
                    <form onSubmit={handleSaveRole} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2 col-span-2"><Label>Role Name</Label><Input name="name" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} maxLength={15} required /></div>
                            <div className="space-y-2"><Label>Color</Label><Input name="color" type="color" value={formData.color} onChange={(e) => setFormData(p => ({ ...p, color: e.target.value }))} className="p-1 h-9" /></div>
                        </div>
                        <div className="space-y-2"><Label>Power Level</Label><Input name="power_level" type="number" value={formData.power_level} onChange={(e) => setFormData(p => ({ ...p, power_level: parseInt(e.target.value, 10) || 0 }))} disabled={!!editingRole?.is_system_role} required /><p className="text-xs text-muted-foreground">1-999. Higher is more powerful.</p></div>
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

                <TabsContent value="settings" className="mt-4 pb-6">
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
