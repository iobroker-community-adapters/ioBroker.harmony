import React, { useState } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    TextField,
    MenuItem,
    IconButton,
    Button,
    Tooltip,
    Chip,
    Select,
    Divider,
    Card,
    CardContent,
    Accordion,
    AccordionSummary,
    AccordionDetails,
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import type { HarmonyDevice, HarmonyActivity, PowerAction, CommandFunction } from '../../types/harmony';
import { IconPicker, getIconById } from '../Common/IconPicker';
import { getDeviceTypeIcon } from '../../utils/deviceTypes';
import { getRoleLabel } from '../../utils/activityTypes';

interface DeviceEditorProps {
    device: HarmonyDevice;
    allActivities: HarmonyActivity[];
    onUpdate: (updated: HarmonyDevice) => void;
    testCommand?: (hubName: string, deviceId: string, command: string) => Promise<{ success: boolean }>;
    hubName?: string;
}

function transportLabel(transport: number): string {
    switch (transport) {
        case 1: return 'IR (Infrared)';
        case 32: return 'IP (Network)';
        case 33: return 'BT (Bluetooth)';
        default: return String(transport);
    }
}

export function DeviceEditor({ device, allActivities, onUpdate, testCommand, hubName }: DeviceEditorProps): React.JSX.Element {
    const [activeTab, setActiveTab] = useState(0);
    const [editingCmd, setEditingCmd] = useState<{ groupIdx: number; funcIdx: number; label: string } | null>(null);
    const [iconPickerOpen, setIconPickerOpen] = useState(false);
    const [testingCmd, setTestingCmd] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<Record<string, 'success' | 'error'>>({});

    const handleField = <K extends keyof HarmonyDevice>(key: K, value: HarmonyDevice[K]): void => {
        onUpdate({ ...device, [key]: value });
    };

    const DevIcon = getDeviceTypeIcon(device.type);

    // ---- Overview Tab ----
    const renderOverview = (): React.JSX.Element => {
        const selectedIcon = getIconById(device.icon || '');

        return (
            <Grid2 container spacing={2} sx={{ maxWidth: 640 }}>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Device Name"
                        value={device.label}
                        onChange={(e): void => handleField('label', e.target.value)}
                        fullWidth
                        size="small"
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Manufacturer"
                        value={device.manufacturer}
                        onChange={(e): void => handleField('manufacturer', e.target.value)}
                        fullWidth
                        size="small"
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Model"
                        value={device.model}
                        onChange={(e): void => handleField('model', e.target.value)}
                        fullWidth
                        size="small"
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Icon
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
                        {selectedIcon ? (
                            <>
                                <selectedIcon.icon sx={{ fontSize: 24, color: 'primary.main' }} />
                                <Typography variant="body2">{selectedIcon.label}</Typography>
                            </>
                        ) : (
                            <>
                                <DevIcon sx={{ fontSize: 24, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                    {device.icon || 'Choose icon...'}
                                </Typography>
                            </>
                        )}
                        <Button size="small" sx={{ ml: 'auto' }}>Change</Button>
                    </Box>
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Type"
                        value={device.type}
                        onChange={(e): void => handleField('type', e.target.value)}
                        fullWidth
                        size="small"
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Transport"
                        value={transportLabel(device.Transport)}
                        fullWidth
                        size="small"
                        slotProps={{ input: { readOnly: true } }}
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="ID"
                        value={device.id}
                        fullWidth
                        size="small"
                        slotProps={{ input: { readOnly: true } }}
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Display Name"
                        value={device.deviceTypeDisplayName || ''}
                        onChange={(e): void => handleField('deviceTypeDisplayName', e.target.value)}
                        fullWidth
                        size="small"
                    />
                </Grid2>
                <IconPicker
                    open={iconPickerOpen}
                    value={device.icon || ''}
                    type="device"
                    onSelect={(iconId): void => handleField('icon', iconId)}
                    onClose={(): void => setIconPickerOpen(false)}
                />
            </Grid2>
        );
    };

    // ---- Commands Tab (Accordion + Chips with Test) ----
    const renderCommands = (): React.JSX.Element => {
        const handleDeleteCommand = (groupIdx: number, funcIdx: number): void => {
            const updatedGroups = (device.controlGroup || []).map((cg, gi) => {
                if (gi !== groupIdx) return cg;
                return {
                    ...cg,
                    function: cg.function.filter((_, fi) => fi !== funcIdx),
                };
            }).filter((cg) => cg.function.length > 0);
            onUpdate({ ...device, controlGroup: updatedGroups });
        };

        const handleSaveLabel = (groupIdx: number, funcIdx: number, newLabel: string): void => {
            const updatedGroups = (device.controlGroup || []).map((cg, gi) => {
                if (gi !== groupIdx) return cg;
                return {
                    ...cg,
                    function: cg.function.map((fn, fi) => fi === funcIdx ? { ...fn, label: newLabel } : fn),
                };
            });
            onUpdate({ ...device, controlGroup: updatedGroups });
            setEditingCmd(null);
        };

        const handleAddCommand = (groupIdx: number): void => {
            const updatedGroups = (device.controlGroup || []).map((cg, gi) => {
                if (gi !== groupIdx) return cg;
                const newFn: CommandFunction = {
                    name: `NewCommand_${Date.now()}`,
                    label: 'New Command',
                    action: '{}',
                };
                return { ...cg, function: [...cg.function, newFn] };
            });
            onUpdate({ ...device, controlGroup: updatedGroups });
        };

        const handleTestCommand = async (commandName: string): Promise<void> => {
            if (!testCommand || !hubName) return;
            const cmdKey = `device_${device.id}_${commandName}`;
            setTestingCmd(cmdKey);
            try {
                const result = await testCommand(hubName, device.id, commandName);
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
                {(device.controlGroup || []).map((cg, gi) => (
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
                                    const cmdKey = `device_${device.id}_${fn.name}`;
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
                {(!device.controlGroup || device.controlGroup.length === 0) && (
                    <Typography variant="body2" color="text.secondary">
                        No commands defined for this device.
                    </Typography>
                )}
            </Box>
        );
    };

    // ---- Power Features Tab (Visual Timeline with full editing) ----
    const renderPowerFeatures = (): React.JSX.Element => {
        const pf = device.powerFeatures || { PowerOnActions: [], PowerOffActions: [] };

        const availableCommands: string[] = [];
        for (const cg of device.controlGroup || []) {
            for (const fn of cg.function) {
                availableCommands.push(fn.name);
            }
        }

        const updateActions = (phase: 'PowerOnActions' | 'PowerOffActions', newActions: PowerAction[]): void => {
            const reordered = newActions.map((a, i) => ({ ...a, Order: i + 1 }));
            const updatedPf = { ...pf, [phase]: reordered };
            onUpdate({ ...device, powerFeatures: updatedPf });
        };

        const renderTimeline = (actions: PowerAction[], phase: 'PowerOnActions' | 'PowerOffActions', title: string): React.JSX.Element => {
            const handleAdd = (actionType: 'IRPressAction' | 'IRDelayAction'): void => {
                const newAction: PowerAction = actionType === 'IRPressAction'
                    ? { __type: 'IRPressAction', Order: actions.length + 1, IRCommandName: availableCommands[0] || 'PowerToggle', Duration: null, ActionId: 0 }
                    : { __type: 'IRDelayAction', Order: actions.length + 1, Delay: 500, Duration: null, ActionId: 0 };
                updateActions(phase, [...actions, newAction]);
            };

            const handleDelete = (index: number): void => {
                updateActions(phase, actions.filter((_, i) => i !== index));
            };

            const handleMoveUp = (index: number): void => {
                if (index === 0) return;
                const arr = [...actions];
                [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
                updateActions(phase, arr);
            };

            const handleMoveDown = (index: number): void => {
                if (index >= actions.length - 1) return;
                const arr = [...actions];
                [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
                updateActions(phase, arr);
            };

            const handleCommandChange = (index: number, cmdName: string): void => {
                const arr = [...actions];
                arr[index] = { ...arr[index], IRCommandName: cmdName };
                updateActions(phase, arr);
            };

            const handleDelayChange = (index: number, delay: number): void => {
                const arr = [...actions];
                arr[index] = { ...arr[index], Delay: delay };
                updateActions(phase, arr);
            };

            const handleDurationChange = (index: number, duration: number): void => {
                const arr = [...actions];
                arr[index] = { ...arr[index], Duration: duration };
                updateActions(phase, arr);
            };

            return (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        {title}
                    </Typography>
                    {actions.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            No actions defined.
                        </Typography>
                    ) : (
                        <Box sx={{ pl: 2 }}>
                            {actions.map((action, i) => {
                                const isIR = action.__type === 'IRPressAction';
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
                                                mt: 2,
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
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                    {isIR ? (
                                                        <BoltIcon fontSize="small" color="primary" />
                                                    ) : (
                                                        <TimerIcon fontSize="small" color="warning" />
                                                    )}
                                                    <Typography variant="body2" fontWeight={500} sx={{ minWidth: 50 }}>
                                                        Step {i + 1}
                                                    </Typography>
                                                    {isIR ? (
                                                        <Select
                                                            value={action.IRCommandName || ''}
                                                            onChange={(e): void => handleCommandChange(i, e.target.value)}
                                                            size="small"
                                                            sx={{ minWidth: 160 }}
                                                        >
                                                            {availableCommands.map((cmd) => (
                                                                <MenuItem key={cmd} value={cmd}>{cmd}</MenuItem>
                                                            ))}
                                                            {action.IRCommandName && !availableCommands.includes(action.IRCommandName) && (
                                                                <MenuItem value={action.IRCommandName}>{action.IRCommandName}</MenuItem>
                                                            )}
                                                        </Select>
                                                    ) : (
                                                        <TextField
                                                            type="number"
                                                            value={action.Delay ?? action.Duration ?? 0}
                                                            onChange={(e): void => {
                                                                const val = Number(e.target.value);
                                                                if (action.Delay != null) handleDelayChange(i, val);
                                                                else handleDurationChange(i, val);
                                                            }}
                                                            size="small"
                                                            sx={{ width: 120 }}
                                                            slotProps={{ input: { endAdornment: <InputAdornment position="end">ms</InputAdornment> } }}
                                                        />
                                                    )}
                                                    <Box sx={{ ml: 'auto', display: 'flex' }}>
                                                        <Tooltip title="Move up">
                                                            <span>
                                                                <IconButton size="small" disabled={i === 0} onClick={(): void => handleMoveUp(i)}>
                                                                    <ArrowUpwardIcon fontSize="small" />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                        <Tooltip title="Move down">
                                                            <span>
                                                                <IconButton size="small" disabled={i >= actions.length - 1} onClick={(): void => handleMoveDown(i)}>
                                                                    <ArrowDownwardIcon fontSize="small" />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                        <Tooltip title="Delete step">
                                                            <IconButton size="small" color="error" onClick={(): void => handleDelete(i)}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, pl: 4 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<BoltIcon />}
                            onClick={(): void => handleAdd('IRPressAction')}
                        >
                            Add IR Command
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            startIcon={<TimerIcon />}
                            onClick={(): void => handleAdd('IRDelayAction')}
                        >
                            Add Delay
                        </Button>
                    </Box>
                </Box>
            );
        };

        return (
            <Box>
                {renderTimeline(pf.PowerOnActions || [], 'PowerOnActions', 'Power On Sequence')}
                <Divider sx={{ my: 2 }} />
                {renderTimeline(pf.PowerOffActions || [], 'PowerOffActions', 'Power Off Sequence')}
            </Box>
        );
    };

    // ---- Used In Tab ----
    const renderUsedIn = (): React.JSX.Element => {
        const usedActivities = allActivities.filter((act) =>
            act.fixit && Object.prototype.hasOwnProperty.call(act.fixit, device.id)
        );

        return (
            <Box>
                {usedActivities.length > 0 ? (
                    <Grid2 container spacing={1.5}>
                        {usedActivities.map((act) => {
                            const rule = act.fixit[device.id];
                            const role = act.roles?.[device.id] || '';
                            return (
                                <Grid2 key={act.id} size={{ xs: 12, sm: 6 }}>
                                    <Card variant="outlined">
                                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                            <Typography variant="subtitle2" fontWeight={600}>
                                                {act.label}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                                {role && (
                                                    <Chip
                                                        label={getRoleLabel(role)}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                )}
                                                <Chip
                                                    label={`Power: ${rule?.Power || '-'}`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                {rule?.Input && (
                                                    <Chip
                                                        label={`Input: ${rule.Input}`}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid2>
                            );
                        })}
                    </Grid2>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        This device is not used in any activity.
                    </Typography>
                )}
            </Box>
        );
    };

    const tabContent = [renderOverview, renderCommands, renderPowerFeatures, renderUsedIn];

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <DevIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">
                    {device.label}
                </Typography>
                <Chip
                    label={`${device.manufacturer} ${device.model}`}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1 }}
                />
            </Box>
            <Tabs
                value={activeTab}
                onChange={(_, val): void => setActiveTab(val)}
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
                <Tab label="Overview" />
                <Tab label="Commands" />
                <Tab label="Power Features" />
                <Tab label="Used In" />
            </Tabs>
            {tabContent[activeTab]()}
        </Box>
    );
}
