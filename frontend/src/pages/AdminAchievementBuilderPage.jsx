import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useBreadcrumbs } from '@/context/BreadcrumbsContext';
import toast from 'react-hot-toast';
import { cn } from "@/lib/utils";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Loader2, Terminal, Plus, Save, Trash2, Globe, BarChart3,
    Clock, Image as ImageIcon, Check, ChevronsUpDown, X, Gamepad2, CornerDownRight
} from 'lucide-react';


import AchievementCard from '../components/AchievementCard';
import { constructImageUrl } from '../utils/url';
import ImageCropperModal from '../components/ImageCropperModal';


const Combobox = ({ options, value, onChange, placeholder }) => {
    const [open, setOpen] = useState(false);
    const selectedOption = options.find(option => option.value === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                    {selectedOption ? selectedOption.label : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem key={option.value} value={option.label} onSelect={() => { onChange(option.value); setOpen(false); }}>
                                    <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};



const CheckRow = ({ check, index, conditionIndex, onUpdate, onRemove }) => {
    const handleCheckChange = (field, value) => {
        onUpdate(conditionIndex, { ...check, [field]: value }, index);
    };
    return (
        <div className="flex items-center gap-2">
            <Input size="sm" placeholder="Source (e.g., player)" value={check.source || ''} onChange={(e) => handleCheckChange('source', e.target.value)} className="flex-1" />
            <Input size="sm" placeholder="Property (e.g., main_hand.type)" value={check.property || ''} onChange={(e) => handleCheckChange('property', e.target.value)} className="flex-1" />
            <Select value={check.operator || '=='} onValueChange={(val) => handleCheckChange('operator', val)}>
                <SelectTrigger className="w-[150px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="==">== (equals)</SelectItem>
                    <SelectItem value=">=">&gt;= (greater/equal)</SelectItem>
                    <SelectItem value="<=">&lt;= (less/equal)</SelectItem>
                    <SelectItem value="contains">contains</SelectItem>
                </SelectContent>
            </Select>
            <Input size="sm" placeholder="Value" value={check.value || ''} onChange={(e) => handleCheckChange('value', e.target.value)} className="flex-1" />
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => onRemove(conditionIndex, index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
        </div>
    );
};

const ConditionBlock = ({ condition, index, onUpdate, onRemove, configData, onUpdateCheck, onAddCheck, onRemoveCheck, serverGroups }) => {
    const handleInputChange = (field, value) => {
        if (field === 'target') {
            onUpdate(index, { ...condition, target: value, specific_target: '' });
        } else {
            onUpdate(index, { ...condition, [field]: value });
        }
    };

    const getEventSubtypes = (baseTrigger) => {
        if (!baseTrigger || !configData.targets) return [];
        return Object.keys(configData.targets).filter(key => key.startsWith(baseTrigger + ":"));
    };
    const getSpecificTargetsForEvent = (eventType) => {
        if (!eventType || !configData.targets[eventType]) return [];
        const targetGroups = configData.targets[eventType];
        let options = [];
        for (const groupName in targetGroups) {
            options = options.concat(targetGroups[groupName]);
        }
        return options.map(opt => ({ label: opt.split(':').pop().replace(/_/g, ' '), value: opt })).sort((a, b) => a.label.localeCompare(b.label));
    };

    const specificTargetOptions = getSpecificTargetsForEvent(condition.target);

    return (
        <Card>
            <CardContent className="p-4 relative space-y-4">
                <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7" onClick={() => onRemove(index)}><X className="h-4 w-4 text-destructive" /></Button>
                <p className="font-semibold">Condition #{index + 1}: <span className="text-primary">{condition.trigger.replace(/_/g, ' ')}</span></p>

                {condition.trigger === 'PERIODIC_CHECK' && (
                    <div className="space-y-4">
                        <div className="space-y-2"><Label>Check Interval (seconds)</Label><Input type="number" value={condition.interval_seconds || 60} onChange={(e) => handleInputChange('interval_seconds', parseInt(e.target.value, 10) || 60)} className="max-w-[200px]" /></div>
                        <div className="space-y-2"><Label>Required Completions</Label><Input type="number" value={condition.count || 1} onChange={(e) => handleInputChange('count', parseInt(e.target.value, 10) || 1)} className="max-w-[200px]" /></div>
                    </div>
                )}

                {condition.trigger === 'PAPI_STAT_CHECK' && (
                    <div className="space-y-4">
                        <div className="space-y-2"><Label>Placeholder</Label><Input placeholder="%statistic_player_kills%" value={condition.target || ''} onChange={(e) => handleInputChange('target', e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Operator</Label><Select value={condition.operator || '>='} onValueChange={(val) => handleInputChange('operator', val)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value=">=">&gt;=</SelectItem><SelectItem value="<=">&lt;=</SelectItem><SelectItem value="==">==</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2"><Label>Required Value</Label><Input type="number" value={condition.count || 1} onChange={(e) => handleInputChange('count', parseInt(e.target.value, 10) || 1)} /></div>
                        </div>
                    </div>
                )}

                {(condition.trigger === 'GAME_EVENT' || condition.trigger === 'WEBSITE_EVENT') && (
                    <div className="space-y-4">
                        <div className="space-y-2"><Label>Event Type</Label><Select value={condition.target || ''} onValueChange={(val) => handleInputChange('target', val)}><SelectTrigger><SelectValue placeholder="Select an event..." /></SelectTrigger><SelectContent>{getEventSubtypes(condition.trigger).map(subtype => (<SelectItem key={subtype} value={subtype}>{subtype.split(':')[1].replace(/_/g, ' ')}</SelectItem>))}</SelectContent></Select></div>
                        {specificTargetOptions.length > 0 && (<div className="space-y-2"><Label>Specific Target</Label><Combobox options={specificTargetOptions} value={condition.specific_target} onChange={(val) => handleInputChange('specific_target', val)} placeholder="Select target..." /></div>)}
                        <div className="space-y-2"><Label>Required Amount</Label><Input type="number" value={condition.count || 1} onChange={(e) => handleInputChange('count', parseInt(e.target.value, 10) || 1)} className="max-w-[200px]" /></div>
                    </div>
                )}

                <div className="space-y-2"><Label>Track on Server Groups (Optional)</Label><Input placeholder="e.g., survival, creative" value={(condition.server_groups || []).join(', ')} onChange={(e) => handleInputChange('server_groups', e.target.value ? e.target.value.split(',').map(s => s.trim()) : [])} /></div>

                {(condition.trigger === 'GAME_EVENT' || condition.trigger === 'PERIODIC_CHECK') && (
                    <div className="space-y-3 pt-3 border-t flex flex-col">
                        <Label>Context Checks (Optional)</Label>
                        {(condition.checks || []).map((check, checkIndex) => (<CheckRow key={checkIndex} check={check} index={checkIndex} conditionIndex={index} onUpdate={onUpdateCheck} onRemove={onRemoveCheck} />))}
                        <Button size="sm" variant="outline" onClick={() => onAddCheck(index)}><Plus className="mr-2 h-4 w-4" />Add Check</Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const BlockPalette = ({ triggers, loading, onSelectTrigger }) => {
    const triggerIcons = { 'GAME_EVENT': <Gamepad2 />, 'PERIODIC_CHECK': <Clock />, 'PAPI_STAT_CHECK': <BarChart3 /> };
    const mainCategories = ['GAME_EVENT', 'PERIODIC_CHECK', 'PAPI_STAT_CHECK'];
    const websiteTriggers = (triggers || []).filter(t => !mainCategories.includes(t) && t !== 'WEBSITE_EVENT' && t !== 'CUSTOM_API_TRIGGER');

    return (
        <Card className="h-full">
            <CardHeader><CardTitle>Toolbox</CardTitle><CardDescription>Click to add conditions.</CardDescription></CardHeader>
            <CardContent>
                {loading ? <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs text-muted-foreground">Game Triggers</Label>
                            <div className="space-y-2 mt-1">
                                {mainCategories.map(triggerName => (
                                    <Button key={triggerName} variant="secondary" className="w-full justify-start" onClick={() => onSelectTrigger(triggerName)}>
                                        {triggerIcons[triggerName] && React.cloneElement(triggerIcons[triggerName], { className: "mr-2 h-4 w-4" })}
                                        {triggerName.replace(/_/g, ' ')}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        {websiteTriggers.length > 0 && (
                            <div>
                                <Label className="text-xs text-muted-foreground">Website Events</Label>
                                <div className="space-y-2 mt-1">
                                    {websiteTriggers.map(triggerName => (
                                        <Button key={triggerName} variant="secondary" className="w-full justify-start" onClick={() => onSelectTrigger('WEBSITE_EVENT', triggerName)}>
                                            <Globe className="mr-2 h-4 w-4" />
                                            {triggerName.replace(/_/g, ' ')}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const SettingsAndPreview = ({ achievementData, onUpdate, allGroups, onGroupChange, authToken, allAchievements }) => {
    const fileInputRef = useRef(null);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImageToCrop(reader.result?.toString() || '');
            setCropperOpen(true);
        });
        reader.readAsDataURL(file);
        event.target.value = null;
    };

    const handleCropComplete = async (croppedImageBlob) => {
        setCropperOpen(false);
        if (!croppedImageBlob) return;

        const formData = new FormData();
        formData.append('file', croppedImageBlob, 'icon.png');

        const toastId = toast.loading('Uploading icon...');
        try {
            const response = await axios.post('/api/media/achievement-icon', formData, { headers: { Authorization: `Bearer ${authToken}` } });
            onUpdate(prev => ({ ...prev, icon_url: response.data.url }));
            toast.success('Icon uploaded!', { id: toastId });
        } catch (error) {
            toast.error('Icon upload failed.', { id: toastId });
        }
    };

    const parentOptions = [
        { label: '— No Parent (Root) —', value: 'null' },
        ...(allAchievements || [])
            .filter(a => a.id !== achievementData.id)            .map(a => ({ label: a.name, value: String(a.id) }))
            .sort((a, b) => a.label.localeCompare(b.label))
    ];

    return (
        <>
            <Card className="h-full">
                <CardHeader><CardTitle>Settings & Preview</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Name</Label><Input name="name" value={achievementData.name} onChange={(e) => onUpdate(p => ({ ...p, name: e.target.value }))} required /></div>
                    <div className="space-y-2"><Label>Description</Label><Textarea name="description" value={achievementData.description} onChange={(e) => onUpdate(p => ({ ...p, description: e.target.value }))} minRows={3} required /></div>

                    <div className="space-y-2">
                        <Label>Parent Achievement</Label>
                        <Combobox
                            options={parentOptions}
                            value={achievementData.parent_id ? String(achievementData.parent_id) : 'null'}
                            onChange={(val) => onUpdate(prev => ({ ...prev, parent_id: val === 'null' ? null : Number(val) }))}
                            placeholder="Select parent..."
                        />
                        <p className="text-xs text-muted-foreground">Determines the achievement's position in the tree.</p>
                    </div>

                    <div className="space-y-2"><Label>Icon</Label>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 rounded-md border"><AvatarImage src={constructImageUrl(achievementData.icon_url)} /><AvatarFallback className="rounded-md bg-secondary"><ImageIcon className="h-8 w-8" /></AvatarFallback></Avatar>
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current.click()}>Upload</Button>
                            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileSelect} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Card Color</Label><Input type="color" name="card_color" value={achievementData.card_color || '#32383E'} onChange={(e) => onUpdate(p => ({ ...p, card_color: e.target.value }))} className="p-1" /></div>
                        <div className="space-y-2"><Label>Text Color</Label><Input type="color" name="text_color" value={achievementData.text_color || '#F0F4F8'} onChange={(e) => onUpdate(p => ({ ...p, text_color: e.target.value }))} className="p-1" /></div>
                    </div>
                    <div className="space-y-2"><Label>Group</Label>
                        <Select value={String(achievementData.group_id || '')} onValueChange={onGroupChange}>
                            <SelectTrigger><SelectValue placeholder="— No Group —" /></SelectTrigger>
                            <SelectContent>{allGroups.map(group => (<SelectItem key={group.id} value={String(group.id)}>{group.name}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2"><Label>Reward Command</Label><Input name="reward_command" value={achievementData.reward_command || ''} onChange={(e) => onUpdate(p => ({ ...p, reward_command: e.target.value }))} placeholder="eco give {username} 100" /></div>
                    <Separator />
                    <Label>Preview</Label>
                    <AchievementCard achievement={achievementData} isPreview={true} />
                </CardContent>
            </Card>
            <ImageCropperModal
                open={cropperOpen}
                onClose={() => setCropperOpen(false)}
                imageSrc={imageToCrop}
                onCropComplete={handleCropComplete}
                aspect={1}
            />
        </>
    );
};


function AdminAchievementBuilderPage() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const parentIdParam = searchParams.get('parentId');

    const isEditing = !!id;
    const { authToken } = useAuth();
    const navigate = useNavigate();
    const { setBreadcrumbs } = useBreadcrumbs();
    const [configData, setConfigData] = useState({ triggers: [], targets: {} });
    const [allGroups, setAllGroups] = useState([]);
    const [allAchievements, setAllAchievements] = useState([]);    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [achievementData, setAchievementData] = useState({
        name: '', description: '', reward_command: '', is_enabled: true,
        group_id: null,
        parent_id: parentIdParam ? Number(parentIdParam) : null,
        card_color: '#32383E', text_color: '#F0F4F8',
        conditions: { logic: 'AND', conditions: [] }
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!authToken) return; setLoading(true);
            try {
                const requests = [
                    axios.get('/api/achievements/admin/config-data', { headers: { Authorization: `Bearer ${authToken}` } }),
                    axios.get('/api/admin/achievement-groups', { headers: { Authorization: `Bearer ${authToken}` } }),
                    axios.get('/api/achievements/admin', { headers: { Authorization: `Bearer ${authToken}` } })                ];
                if (isEditing) requests.push(axios.get(`/api/achievements/admin/${id}`, { headers: { Authorization: `Bearer ${authToken}` } }));

                const [configRes, groupsRes, achievementsRes, achievementRes] = await Promise.all(requests);

                setConfigData(configRes.data);
                setAllGroups(groupsRes.data);
                setAllAchievements(achievementsRes.data);
                if (isEditing && achievementRes) {
                    const fetchedData = achievementRes.data;
                    const processedConditions = (fetchedData.conditions.conditions || []).map(cond => {
                        const targetParts = cond.target.split(':');
                        if (targetParts.length > 2) {
                            return { ...cond, target: `${targetParts[0]}:${targetParts[1]}`, specific_target: cond.target };
                        }
                        return cond;
                    });
                    fetchedData.conditions.conditions = processedConditions;
                    setAchievementData(fetchedData);
                }
            } catch (err) { setError("Failed to load achievement builder data."); } finally { setLoading(false); }
        };
        fetchInitialData();
    }, [id, isEditing, authToken]);

    useEffect(() => {
        setBreadcrumbs([{ label: 'Admin Panel' }, { label: 'Achievements', link: '/admin/achievements' }, { label: isEditing ? 'Edit' : 'Create' }]);
        return () => setBreadcrumbs([]);
    }, [setBreadcrumbs, isEditing]);

    const handleLogicChange = (newLogic) => setAchievementData(prev => ({ ...prev, conditions: { ...prev.conditions, logic: newLogic } }));
    const handleSaveAchievement = async () => {
        setIsSaving(true);
        const preparedData = { ...achievementData, conditions: { ...achievementData.conditions, conditions: achievementData.conditions.conditions.map((cond, index) => ({ ...cond, index })) } };
        try {
            const apiCall = isEditing ? axios.patch(`/api/achievements/admin/${id}`, preparedData, { headers: { Authorization: `Bearer ${authToken}` } }) : axios.post('/api/achievements/admin', preparedData, { headers: { Authorization: `Bearer ${authToken}` } });
            await apiCall;
            toast.success(`Achievement ${isEditing ? 'updated' : 'created'}!`);
            navigate('/admin/achievements');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to save achievement.'); } finally { setIsSaving(false); }
    };
    const handleAddCondition = (triggerName, target) => {
        let newCondition = { trigger: triggerName, target: target || '', count: 1, checks: [] };
        if (triggerName === 'WEBSITE_EVENT' && target) {
            newCondition.target = `WEBSITE_EVENT:${target}`;
        }
        if (triggerName === 'PAPI_STAT_CHECK') newCondition.operator = '>=';
        setAchievementData(prev => ({ ...prev, conditions: { ...prev.conditions, conditions: [...prev.conditions.conditions, newCondition] } }));
    };
    const handleUpdateCondition = (index, updatedCondition) => setAchievementData(prev => ({ ...prev, conditions: { ...prev.conditions, conditions: prev.conditions.conditions.map((c, i) => i === index ? updatedCondition : c) } }));
    const handleRemoveCondition = (index) => setAchievementData(prev => ({ ...prev, conditions: { ...prev.conditions, conditions: prev.conditions.conditions.filter((_, i) => i !== index) } }));
    const handleGroupChange = (newValue) => setAchievementData(prev => ({ ...prev, group_id: newValue ? Number(newValue) : null }));

    const handleAddCheck = (conditionIndex) => {
        setAchievementData(prev => ({
            ...prev,
            conditions: {
                ...prev.conditions,
                conditions: prev.conditions.conditions.map((cond, i) => {
                    if (i === conditionIndex) {
                        return {
                            ...cond,
                            checks: [
                                ...(cond.checks || []),
                                { source: '', property: '', operator: '==', value: '' }
                            ]
                        };
                    }
                    return cond;
                })
            }
        }));
    };

    const handleRemoveCheck = (conditionIndex, checkIndex) => {
        setAchievementData(prev => ({
            ...prev,
            conditions: {
                ...prev.conditions,
                conditions: prev.conditions.conditions.map((cond, i) => {
                    if (i === conditionIndex) {
                        return {
                            ...cond,
                            checks: cond.checks.filter((_, ci) => ci !== checkIndex)
                        };
                    }
                    return cond;
                })
            }
        }));
    };

    const handleUpdateCheck = (conditionIndex, updatedCheck, checkIndex) => {
        setAchievementData(prev => ({
            ...prev,
            conditions: {
                ...prev.conditions,
                conditions: prev.conditions.conditions.map((cond, i) => {
                    if (i === conditionIndex) {
                        const newChecks = [...(cond.checks || [])];
                        newChecks[checkIndex] = updatedCheck;
                        return {
                            ...cond,
                            checks: newChecks
                        };
                    }
                    return cond;
                })
            }
        }));
    };
    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className="font-sans text-3xl font-bold">{isEditing ? 'Edit Achievement' : 'Create Achievement'}</h1>
                    {achievementData.parent_id && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <CornerDownRight className="h-4 w-4" /> Creating child for achievement ID: {achievementData.parent_id}
                        </span>
                    )}
                </div>
                <Button onClick={handleSaveAchievement} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}<Save className="mr-2 h-4 w-4" />{isEditing ? 'Save Changes' : 'Create'}</Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-3"><BlockPalette triggers={configData.triggers} loading={loading} onSelectTrigger={handleAddCondition} /></div>
                <div className="lg:col-span-6 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Achievement Logic</CardTitle>
                            {achievementData.conditions.conditions.length > 1 && (
                                <div className="flex items-center space-x-4 pt-2">
                                    <Label>Completion Logic</Label>
                                    <RadioGroup value={achievementData.conditions.logic} onValueChange={handleLogicChange} className="flex space-x-4">
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="AND" id="logic-and" /><Label htmlFor="logic-and">AND (All)</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="OR" id="logic-or" /><Label htmlFor="logic-or">OR (Any)</Label></div>
                                    </RadioGroup>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(achievementData.conditions.conditions || []).map((cond, index) => (
                                <ConditionBlock key={index} condition={cond} index={index} onUpdate={handleUpdateCondition} onRemove={handleRemoveCondition} configData={configData} onAddCheck={handleAddCheck} onRemoveCheck={handleRemoveCheck} onUpdateCheck={handleUpdateCheck} serverGroups={[]} />
                            ))}
                            {achievementData.conditions.conditions.length === 0 && <p className="text-muted-foreground text-center py-4">Add a condition from the toolbox to begin.</p>}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-3">
                    <SettingsAndPreview
                        achievementData={achievementData}
                        onUpdate={setAchievementData}
                        allGroups={allGroups}
                        onGroupChange={handleGroupChange}
                        authToken={authToken}
                        allAchievements={allAchievements}
                    />
                </div>
            </div>
        </div>
    );
}

export default AdminAchievementBuilderPage;