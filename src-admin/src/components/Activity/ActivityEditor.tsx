import React, { useState } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    TextField,
    Select,
    MenuItem,
    IconButton,
    Button,
    Checkbox,
    FormControlLabel,
    Tooltip,
    Divider,
    Chip,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Collapse,
    InputAdornment,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BoltIcon from '@mui/icons-material/Bolt';
import TimerIcon from '@mui/icons-material/Timer';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { I18n } from '@iobroker/adapter-react-v5';
import type { HarmonyActivity, HarmonyDevice, PowerAction, FixItRule, CommandFunction } from '../../types/harmony';
import { IconPicker, getIconById, getIconSrc } from '../Common/IconPicker';
import { ACTIVITY_TYPE_MAP, getActivityTypeLabel, getActivityIconSrc, ROLE_LABEL_MAP, getRoleLabel } from '../../utils/activityTypes';
import { getDeviceIconSrc } from '../../utils/deviceTypes';
import { getCommandIconSrc } from '../../utils/commandIcons';
import { HarmonyIcon } from '../Common/HarmonyIcon';

interface ActivityEditorProps {
    activity: HarmonyActivity;
    allDevices: HarmonyDevice[];
    onUpdate: (updated: HarmonyActivity) => void;
    testCommand?: (hubName: string, deviceId: string, command: string) => Promise<{ success: boolean }>;
    hubName?: string;
}

const ROLE_OPTIONS = [
    '',
    'VolumeActivityRole',
    'DisplayActivityRole',
    'PlayMovieActivityRole',
    'PlayMusicActivityRole',
    'ChannelChangingActivityRole',
    'TextEntryActivityRole',
    'NavigationActivityRole',
    'GamePlayingActivityRole',
];

export function ActivityEditor({ activity, allDevices, onUpdate, testCommand, hubName }: ActivityEditorProps): React.JSX.Element {
    const [activeTab, setActiveTab] = useState(0);
    const [editingCmd, setEditingCmd] = useState<{ groupIdx: number; funcIdx: number; label: string } | null>(null);
    const [iconPickerOpen, setIconPickerOpen] = useState(false);
    const [addDeviceOpen, setAddDeviceOpen] = useState(false);
    const [expandedDevice, setExpandedDevice] = useState<string | null>(null);
    const [testingCmd, setTestingCmd] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<Record<string, 'success' | 'error'>>({});

    const handleField = <K extends keyof HarmonyActivity>(key: K, value: HarmonyActivity[K]): void => {
        onUpdate({ ...activity, [key]: value });
    };

    // ---- Overview Tab ----
    const renderOverview = (): React.JSX.Element => {
        const selectedIcon = getIconById(activity.icon || '');
        const selectedIconSrc = getIconSrc(activity.icon || '');
        const activityIconSrc = getActivityIconSrc(activity.type);

        return (
            <Grid2 container spacing={2} sx={{ maxWidth: 640 }}>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label={I18n.t('name')}
                        value={activity.label}
                        onChange={(e): void => handleField('label', e.target.value)}
                        fullWidth
                        size="small"
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label={I18n.t('type')}
                        value={activity.type}
                        onChange={(e): void => handleField('type', e.target.value)}
                        fullWidth
                        size="small"
                        select
                    >
                        {Object.entries(ACTIVITY_TYPE_MAP).map(([value, info]) => (
                            <MenuItem key={value} value={value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <HarmonyIcon src={`./custom/icons/${info.file}`} alt={info.label} size={24} />
                                    {info.label}
                                </Box>
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label={I18n.t('order')}
                        type="number"
                        value={activity.activityOrder ?? 0}
                        onChange={(e): void => handleField('activityOrder', Number(e.target.value))}
                        fullWidth
                        size="small"
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        {I18n.t('icon')}
                    </Typography>
                    <Box
                        onClick={(): void => setIconPickerOpen(true)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                        }}
                    >
                        {selectedIcon && selectedIconSrc ? (
                            <>
                                <HarmonyIcon src={selectedIconSrc} alt={selectedIcon.label} size={28} />
                                <Typography variant="body2">{selectedIcon.label}</Typography>
                            </>
                        ) : (
                            <>
                                <HarmonyIcon src={activityIconSrc} alt="activity icon" size={28} />
                                <Typography variant="body2" color="text.secondary">
                                    {activity.icon || I18n.t('chooseIcon')}
                                </Typography>
                            </>
                        )}
                        <Button size="small" sx={{ ml: 'auto' }}>{I18n.t('changeIcon')}</Button>
                    </Box>
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label={I18n.t('name')}
                        value={activity.activityTypeDisplayName || ''}
                        onChange={(e): void => handleField('activityTypeDisplayName', e.target.value)}
                        fullWidth
                        size="small"
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="ID"
                        value={activity.id}

                        fullWidth
                        size="small"
                        slotProps={{ input: { readOnly: true } }}
                    />
                </Grid2>
                <IconPicker
                    open={iconPickerOpen}
                    value={activity.icon || ''}
                    type="activity"
                    onSelect={(iconId): void => handleField('icon', iconId)}
                    onClose={(): void => setIconPickerOpen(false)}
                />
            </Grid2>
        );
    };

    // ---- Devices & Roles Tab (card-based) ----
    const renderDevicesRoles = (): React.JSX.Element => {
        const fixitEntries = Object.entries(activity.fixit || {});
        const assignedDeviceIds = new Set(fixitEntries.map(([id]) => id));
        const availableDevices = allDevices.filter((d) => !assignedDeviceIds.has(d.id));

        const handleRoleChange = (deviceId: string, role: string): void => {
            const updatedRoles = { ...(activity.roles || {}) };
            if (role) {
                updatedRoles[deviceId] = role;
            } else {
                delete updatedRoles[deviceId];
            }
            onUpdate({ ...activity, roles: updatedRoles });
        };

        const handleRemoveDevice = (deviceId: string): void => {
            const updatedFixit = { ...(activity.fixit || {}) };
            delete updatedFixit[deviceId];
            const updatedRoles = { ...(activity.roles || {}) };
            delete updatedRoles[deviceId];
            onUpdate({ ...activity, fixit: updatedFixit, roles: updatedRoles });
        };

        const handleAddDevice = (deviceId: string): void => {
            const updatedFixit = { ...(activity.fixit || {}) };
            updatedFixit[deviceId] = { id: deviceId, Power: 'On', isRelativePower: false, isManualPower: false };
            onUpdate({ ...activity, fixit: updatedFixit });
            setAddDeviceOpen(false);
        };

        const handleFixitChange = (deviceId: string, field: keyof FixItRule, value: string | boolean): void => {
            const updatedFixit = { ...(activity.fixit || {}) };
            updatedFixit[deviceId] = { ...updatedFixit[deviceId], [field]: value };
            onUpdate({ ...activity, fixit: updatedFixit });
        };

        return (
            <Box>
                {/* Section 1: Devices in this activity */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                        Devices in this Activity ({fixitEntries.length})
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        size="small"
                        onClick={(): void => setAddDeviceOpen(true)}
                        disabled={availableDevices.length === 0}
                    >
                        {I18n.t('addDevice')}
                    </Button>
                </Box>

                {fixitEntries.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                        No devices assigned to this activity yet. Click "Add Device" to get started.
                    </Typography>
                )}

                <Grid2 container spacing={2}>
                    {fixitEntries.map(([deviceId, rule]) => {
                        const device = allDevices.find((d) => d.id === deviceId);
                        const role = activity.roles?.[deviceId] || '';
                        const devIconSrc = device ? getDeviceIconSrc(device.type) : getDeviceIconSrc('');
                        const isExpanded = expandedDevice === deviceId;

                        return (
                            <Grid2 key={deviceId} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        transition: 'all 0.15s ease',
                                        '&:hover': { borderColor: 'primary.main' },
                                    }}
                                >
                                    <CardContent sx={{ pb: isExpanded ? 2 : '12px !important', pt: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <HarmonyIcon src={devIconSrc} alt={device?.label || deviceId} size={32} />
                                            <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }} noWrap>
                                                {device?.label || deviceId}
                                            </Typography>
                                            <Tooltip title="Remove from activity">
                                                <IconButton
                                                    size="small"
                                                    onClick={(): void => handleRemoveDevice(deviceId)}
                                                    sx={{ ml: 'auto' }}
                                                >
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                            {role && (
                                                <Chip
                                                    label={getRoleLabel(role)}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            )}
                                            <Chip
                                                label={`Power: ${rule.Power}`}
                                                size="small"
                                                variant="outlined"
                                                color={rule.Power === 'On' ? 'success' : 'default'}
                                            />
                                        </Box>
                                        <Button
                                            size="small"
                                            onClick={(): void => setExpandedDevice(isExpanded ? null : deviceId)}
                                            sx={{ mt: 0.5, textTransform: 'none', fontSize: 12 }}
                                        >
                                            {isExpanded ? 'Collapse' : 'Edit Settings'}
                                        </Button>
                                        <Collapse in={isExpanded}>
                                            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                <Select
                                                    value={role}
                                                    onChange={(e): void => handleRoleChange(deviceId, e.target.value)}
                                                    size="small"
                                                    displayEmpty
                                                    fullWidth
                                                >
                                                    <MenuItem value="">
                                                        <em>{I18n.t('noRole')}</em>
                                                    </MenuItem>
                                                    {ROLE_OPTIONS.filter(Boolean).map((r) => (
                                                        <MenuItem key={r} value={r}>{getRoleLabel(r)}</MenuItem>
                                                    ))}
                                                </Select>
                                                <Select
                                                    value={rule.Power}
                                                    onChange={(e): void => handleFixitChange(deviceId, 'Power', e.target.value)}
                                                    size="small"
                                                    fullWidth
                                                >
                                                    <MenuItem value="On">{I18n.t('powerOn')}</MenuItem>
                                                    <MenuItem value="Off">{I18n.t('powerOff')}</MenuItem>
                                                    <MenuItem value="Toggle">{I18n.t('powerToggle')}</MenuItem>
                                                </Select>
                                                <TextField
                                                    value={rule.Input || ''}
                                                    onChange={(e): void => handleFixitChange(deviceId, 'Input', e.target.value)}
                                                    size="small"
                                                    placeholder="Input source (e.g. HDMI1)"
                                                    fullWidth
                                                    label={I18n.t('input')}
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={!!rule.isRelativePower}
                                                            onChange={(e): void => handleFixitChange(deviceId, 'isRelativePower', e.target.checked)}
                                                            size="small"
                                                        />
                                                    }
                                                    label={<Typography variant="body2">{I18n.t('relativePower')}</Typography>}
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={!!rule.isManualPower}
                                                            onChange={(e): void => handleFixitChange(deviceId, 'isManualPower', e.target.checked)}
                                                            size="small"
                                                        />
                                                    }
                                                    label={<Typography variant="body2">{I18n.t('manualPower')}</Typography>}
                                                />
                                            </Box>
                                        </Collapse>
                                    </CardContent>
                                </Card>
                            </Grid2>
                        );
                    })}
                </Grid2>

                {/* Add Device Dialog */}
                <Dialog
                    open={addDeviceOpen}
                    onClose={(): void => setAddDeviceOpen(false)}
                    maxWidth="xs"
                    fullWidth
                >
                    <DialogTitle>Add Device to Activity</DialogTitle>
                    <DialogContent>
                        {availableDevices.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                All hub devices are already in this activity.
                            </Typography>
                        ) : (
                            <List dense>
                                {availableDevices.map((dev) => (
                                    <ListItemButton
                                        key={dev.id}
                                        onClick={(): void => handleAddDevice(dev.id)}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <HarmonyIcon src={getDeviceIconSrc(dev.type)} alt={dev.label} size={24} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={dev.label}
                                            secondary={`${dev.manufacturer} ${dev.model}`}
                                        />
                                    </ListItemButton>
                                ))}
                            </List>
                        )}
                    </DialogContent>
                </Dialog>
            </Box>
        );
    };

    // ---- Power Sequences Tab (Visual Timeline) ----
    const renderPowerSequences = (): React.JSX.Element => {
        const fixitEntries = Object.entries(activity.fixit || {});

        return (
            <Box>
                {fixitEntries.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        No devices in this activity. Add devices in the "Devices & Roles" tab first.
                    </Typography>
                )}
                {fixitEntries.map(([deviceId]) => {
                    const device = allDevices.find((d) => d.id === deviceId);
                    if (!device) return null;
                    const pf = device.powerFeatures;

                    return (
                        <Card key={deviceId} variant="outlined" sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                    {device.label}
                                </Typography>
                                <PowerTimeline
                                    title="Power On Sequence"
                                    actions={pf?.PowerOnActions || []}
                                    device={device}
                                />
                                <Divider sx={{ my: 2 }} />
                                <PowerTimeline
                                    title="Power Off Sequence"
                                    actions={pf?.PowerOffActions || []}
                                    device={device}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                    Edit power sequences in the Device Editor for full control.
                                </Typography>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
        );
    };

    // ---- FixIt Rules Tab ----
    const renderFixitRules = (): React.JSX.Element => {
        const fixitEntries = Object.entries(activity.fixit || {});

        const handleFixitChange = (deviceId: string, field: keyof FixItRule, value: string | boolean): void => {
            const updatedFixit = { ...(activity.fixit || {}) };
            updatedFixit[deviceId] = { ...updatedFixit[deviceId], [field]: value };
            onUpdate({ ...activity, fixit: updatedFixit });
        };

        return (
            <Box>
                {fixitEntries.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No FixIt rules. Add devices in the "Devices & Roles" tab first.
                    </Typography>
                )}
                {fixitEntries.map(([deviceId, rule]) => {
                    const device = allDevices.find((d) => d.id === deviceId);
                    const devIconSrc = device ? getDeviceIconSrc(device.type) : getDeviceIconSrc('');
                    return (
                        <Card key={deviceId} variant="outlined" sx={{ mb: 1.5 }}>
                            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <HarmonyIcon src={devIconSrc} alt={device?.label || deviceId} size={24} />
                                    <Typography variant="subtitle2" fontWeight={600}>
                                        {device?.label || deviceId}
                                    </Typography>
                                </Box>
                                <Grid2 container spacing={1.5}>
                                    <Grid2 size={{ xs: 6, sm: 3 }}>
                                        <Select
                                            value={rule.Power}
                                            onChange={(e): void => handleFixitChange(deviceId, 'Power', e.target.value)}
                                            size="small"
                                            fullWidth
                                        >
                                            <MenuItem value="On">{I18n.t('powerOn')}</MenuItem>
                                            <MenuItem value="Off">{I18n.t('powerOff')}</MenuItem>
                                            <MenuItem value="Toggle">{I18n.t('powerToggle')}</MenuItem>
                                        </Select>
                                    </Grid2>
                                    <Grid2 size={{ xs: 6, sm: 3 }}>
                                        <TextField
                                            value={rule.Input || ''}
                                            onChange={(e): void => handleFixitChange(deviceId, 'Input', e.target.value)}
                                            size="small"
                                            placeholder={I18n.t('input')}
                                            label={I18n.t('input')}
                                            fullWidth
                                        />
                                    </Grid2>
                                    <Grid2 size={{ xs: 6, sm: 3 }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={!!rule.isRelativePower}
                                                    onChange={(e): void => handleFixitChange(deviceId, 'isRelativePower', e.target.checked)}
                                                    size="small"
                                                />
                                            }
                                            label={<Typography variant="caption">{I18n.t('relativePower')}</Typography>}
                                        />
                                    </Grid2>
                                    <Grid2 size={{ xs: 6, sm: 3 }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={!!rule.isManualPower}
                                                    onChange={(e): void => handleFixitChange(deviceId, 'isManualPower', e.target.checked)}
                                                    size="small"
                                                />
                                            }
                                            label={<Typography variant="caption">{I18n.t('manualPower')}</Typography>}
                                        />
                                    </Grid2>
                                </Grid2>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
        );
    };

    // ---- Commands Tab (Accordion + Chips with Test buttons) ----
    const renderCommands = (): React.JSX.Element => {
        const handleDeleteCommand = (groupIdx: number, funcIdx: number): void => {
            const updatedGroups = (activity.controlGroup || []).map((cg, gi) => {
                if (gi !== groupIdx) return cg;
                return {
                    ...cg,
                    function: cg.function.filter((_, fi) => fi !== funcIdx),
                };
            }).filter((cg) => cg.function.length > 0);
            onUpdate({ ...activity, controlGroup: updatedGroups });
        };

        const handleSaveLabel = (groupIdx: number, funcIdx: number, newLabel: string): void => {
            const updatedGroups = (activity.controlGroup || []).map((cg, gi) => {
                if (gi !== groupIdx) return cg;
                return {
                    ...cg,
                    function: cg.function.map((fn, fi) => fi === funcIdx ? { ...fn, label: newLabel } : fn),
                };
            });
            onUpdate({ ...activity, controlGroup: updatedGroups });
            setEditingCmd(null);
        };

        const handleAddCommand = (groupIdx: number): void => {
            const updatedGroups = (activity.controlGroup || []).map((cg, gi) => {
                if (gi !== groupIdx) return cg;
                const newFn: CommandFunction = {
                    name: `NewCommand_${Date.now()}`,
                    label: 'New Command',
                    action: '{}',
                };
                return { ...cg, function: [...cg.function, newFn] };
            });
            onUpdate({ ...activity, controlGroup: updatedGroups });
        };

        const handleTestCommand = async (commandName: string): Promise<void> => {
            if (!testCommand || !hubName) return;
            const cmdKey = `activity_${activity.id}_${commandName}`;
            setTestingCmd(cmdKey);
            try {
                const result = await testCommand(hubName, activity.id, commandName);
                setTestResult((prev) => ({ ...prev, [cmdKey]: result.success ? 'success' : 'error' }));
            } catch {
                setTestResult((prev) => ({ ...prev, [cmdKey]: 'error' }));
            }
            setTestingCmd(null);
            setTimeout(() => {
                setTestResult((prev) => {
                    const next = { ...prev };
                    delete next[cmdKey];
                    return next;
                });
            }, 2000);
        };

        return (
            <Box>
                {(activity.controlGroup || []).map((cg, gi) => (
                    <Accordion key={cg.name} defaultExpanded variant="outlined" sx={{ mb: 1, '&:before': { display: 'none' } }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Typography variant="subtitle2" fontWeight={600}>
                                    {cg.name}
                                </Typography>
                                <Chip label={`${cg.function.length} commands`} size="small" variant="outlined" />
                                <Tooltip title="Add command">
                                    <IconButton
                                        size="small"
                                        onClick={(e): void => { e.stopPropagation(); handleAddCommand(gi); }}
                                        sx={{ ml: 'auto' }}
                                    >
                                        <AddIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid2 container spacing={1}>
                                {cg.function.map((fn, fi) => {
                                    const cmdKey = `activity_${activity.id}_${fn.name}`;
                                    const result = testResult[cmdKey];
                                    const isTesting = testingCmd === cmdKey;

                                    if (editingCmd?.groupIdx === gi && editingCmd?.funcIdx === fi) {
                                        return (
                                            <Grid2 key={fn.name} size={{ xs: 12 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0.5 }}>
                                                    <TextField
                                                        value={editingCmd.label}
                                                        onChange={(e): void => setEditingCmd({ ...editingCmd, label: e.target.value })}
                                                        size="small"
                                                        sx={{ minWidth: 160 }}
                                                        label="Label"
                                                    />
                                                    <IconButton size="small" color="primary" onClick={(): void => handleSaveLabel(gi, fi, editingCmd.label)}>
                                                        <SaveIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={(): void => setEditingCmd(null)}>
                                                        <CancelIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Grid2>
                                        );
                                    }

                                    const cmdIconSrc = getCommandIconSrc(fn.name);

                                    return (
                                        <Grid2 key={fn.name} size="auto">
                                            <Chip
                                                label={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <span>{fn.label}</span>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {fn.name !== fn.label ? fn.name : ''}
                                                        </Typography>
                                                    </Box>
                                                }
                                                variant="outlined"
                                                sx={{
                                                    height: 'auto',
                                                    py: 0.5,
                                                    borderColor: result === 'success' ? 'success.main' : result === 'error' ? 'error.main' : undefined,
                                                    transition: 'border-color 0.3s ease',
                                                }}
                                                onDelete={(): void => handleDeleteCommand(gi, fi)}
                                                deleteIcon={<DeleteIcon fontSize="small" />}
                                                icon={
                                                    result === 'success' ? <CheckCircleIcon fontSize="small" color="success" /> :
                                                    result === 'error' ? <ErrorOutlineIcon fontSize="small" color="error" /> :
                                                    cmdIconSrc ? <HarmonyIcon src={cmdIconSrc} alt={fn.name} size={20} /> :
                                                    undefined
                                                }
                                                onClick={(): void => setEditingCmd({ groupIdx: gi, funcIdx: fi, label: fn.label })}
                                            />
                                            {testCommand && hubName && (
                                                <Tooltip title="Test command">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        disabled={isTesting}
                                                        onClick={(): void => { void handleTestCommand(fn.name); }}
                                                        sx={{ ml: -0.5 }}
                                                    >
                                                        <PlayArrowIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Grid2>
                                    );
                                })}
                            </Grid2>
                        </AccordionDetails>
                    </Accordion>
                ))}
                {(!activity.controlGroup || activity.controlGroup.length === 0) && (
                    <Typography variant="body2" color="text.secondary">
                        No commands defined for this activity.
                    </Typography>
                )}
            </Box>
        );
    };

    const tabContent = [renderOverview, renderDevicesRoles, renderPowerSequences, renderFixitRules, renderCommands];

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <HarmonyIcon src={getActivityIconSrc(activity.type)} alt={activity.label} size={36} />
                <Typography variant="h6">
                    {activity.label}
                </Typography>
                <Chip label={getActivityTypeLabel(activity.type)} size="small" variant="outlined" sx={{ ml: 1 }} />
            </Box>
            <Tabs
                value={activeTab}
                onChange={(_, val): void => setActiveTab(val)}
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
                <Tab label={I18n.t('overview')} />
                <Tab label={I18n.t('devicesAndRoles')} />
                <Tab label={I18n.t('powerSequences')} />
                <Tab label={I18n.t('fixitRules')} />
                <Tab label={I18n.t('commands')} />
            </Tabs>
            {tabContent[activeTab]()}
        </Box>
    );
}

// ---- Power Timeline Sub-component (visual vertical timeline) ----

interface PowerTimelineProps {
    title: string;
    actions: PowerAction[];
    device: HarmonyDevice;
}

function PowerTimeline({ title, actions }: PowerTimelineProps): React.JSX.Element {
    return (
        <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                {title}
            </Typography>
            {actions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    No actions defined.
                </Typography>
            ) : (
                <Box sx={{ pl: 2 }}>
                    {actions.map((action, i) => {
                        const isIR = action.__type === 'IRPressAction';
                        const cmdIconSrc = isIR && action.IRCommandName ? getCommandIconSrc(action.IRCommandName) : undefined;
                        return (
                            <Box key={i} sx={{ display: 'flex', gap: 0 }}>
                                {/* Connector line */}
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    mr: 1.5,
                                    width: 20,
                                }}>
                                    <Box sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        bgcolor: isIR ? 'primary.main' : 'warning.main',
                                        mt: 1.5,
                                    }} />
                                    {i < actions.length - 1 && (
                                        <Box sx={{
                                            width: 2,
                                            flex: 1,
                                            bgcolor: 'divider',
                                        }} />
                                    )}
                                </Box>
                                {/* Step card */}
                                <Card
                                    variant="outlined"
                                    sx={{
                                        flex: 1,
                                        mb: 1,
                                        borderLeft: 3,
                                        borderLeftColor: isIR ? 'primary.main' : 'warning.main',
                                    }}
                                >
                                    <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {isIR ? (
                                                cmdIconSrc ? <HarmonyIcon src={cmdIconSrc} alt={action.IRCommandName || ''} size={20} /> : <BoltIcon fontSize="small" color="primary" />
                                            ) : (
                                                <TimerIcon fontSize="small" color="warning" />
                                            )}
                                            <Typography variant="body2" fontWeight={500}>
                                                Step {i + 1}:
                                            </Typography>
                                            <Typography variant="body2">
                                                {isIR
                                                    ? `IR Command: ${action.IRCommandName || '-'}`
                                                    : `Delay: ${action.Delay ?? action.Duration ?? '-'} ms`
                                                }
                                            </Typography>
                                            {isIR && action.Duration != null && (
                                                <Typography variant="caption" color="text.secondary">
                                                    ({action.Duration} ms)
                                                </Typography>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}
