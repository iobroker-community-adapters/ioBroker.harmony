import React, { useState } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    TextField,
    MenuItem,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    IconButton,
    Button,
    Tooltip,
    Chip,
    Select,
    Divider,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import type { HarmonyDevice, HarmonyActivity, PowerAction, CommandFunction } from '../../types/harmony';

interface DeviceEditorProps {
    device: HarmonyDevice;
    allActivities: HarmonyActivity[];
    onUpdate: (updated: HarmonyDevice) => void;
}

function transportLabel(transport: number): string {
    switch (transport) {
        case 1: return 'IR';
        case 32: return 'IP';
        case 33: return 'BT';
        default: return String(transport);
    }
}

export function DeviceEditor({ device, allActivities, onUpdate }: DeviceEditorProps): React.JSX.Element {
    const [activeTab, setActiveTab] = useState(0);

    const handleField = <K extends keyof HarmonyDevice>(key: K, value: HarmonyDevice[K]): void => {
        onUpdate({ ...device, [key]: value });
    };

    // ---- Overview Tab ----
    const renderOverview = (): React.JSX.Element => (
        <Grid2 container spacing={2} sx={{ maxWidth: 600 }}>
            <Grid2 size={{ xs: 12, sm: 6 }}>
                <TextField
                    label="Name"
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
                <TextField
                    label="Icon"
                    value={device.icon || ''}
                    onChange={(e): void => handleField('icon', e.target.value)}
                    fullWidth
                    size="small"
                />
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
        </Grid2>
    );

    // ---- Commands Tab (FULLY EDITABLE) ----
    const renderCommands = (): React.JSX.Element => {
        const [editingCmd, setEditingCmd] = useState<{ groupIdx: number; funcIdx: number; label: string } | null>(null);

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

        return (
            <Box>
                {(device.controlGroup || []).map((cg, gi) => (
                    <Box key={cg.name} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                                {cg.name}
                            </Typography>
                            <Tooltip title="Add command to this group">
                                <IconButton size="small" onClick={(): void => handleAddCommand(gi)}>
                                    <AddIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Label</TableCell>
                                    <TableCell sx={{ fontWeight: 600, maxWidth: 300 }}>Action</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {cg.function.map((fn, fi) => (
                                    <TableRow key={fn.name}>
                                        <TableCell>{fn.name}</TableCell>
                                        <TableCell>
                                            {editingCmd?.groupIdx === gi && editingCmd?.funcIdx === fi ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <TextField
                                                        value={editingCmd.label}
                                                        onChange={(e): void => setEditingCmd({ ...editingCmd, label: e.target.value })}
                                                        size="small"
                                                        sx={{ minWidth: 120 }}
                                                    />
                                                    <IconButton size="small" onClick={(): void => handleSaveLabel(gi, fi, editingCmd.label)}>
                                                        <SaveIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={(): void => setEditingCmd(null)}>
                                                        <CancelIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            ) : (
                                                fn.label
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {fn.action}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Edit label">
                                                <IconButton
                                                    size="small"
                                                    onClick={(): void => setEditingCmd({ groupIdx: gi, funcIdx: fi, label: fn.label })}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete command">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={(): void => handleDeleteCommand(gi, fi)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                ))}
                {(!device.controlGroup || device.controlGroup.length === 0) && (
                    <Typography variant="body2" color="text.secondary">
                        No commands defined for this device.
                    </Typography>
                )}
            </Box>
        );
    };

    // ---- Power Features Tab (FULLY FUNCTIONAL VISUAL EDITOR) ----
    const renderPowerFeatures = (): React.JSX.Element => {
        const pf = device.powerFeatures || { PowerOnActions: [], PowerOffActions: [] };

        // Get all available IR commands from the device's control groups
        const availableCommands: string[] = [];
        for (const cg of device.controlGroup || []) {
            for (const fn of cg.function) {
                availableCommands.push(fn.name);
            }
        }

        const updateActions = (phase: 'PowerOnActions' | 'PowerOffActions', newActions: PowerAction[]): void => {
            // Re-number orders
            const reordered = newActions.map((a, i) => ({ ...a, Order: i + 1 }));
            const updatedPf = { ...pf, [phase]: reordered };
            onUpdate({ ...device, powerFeatures: updatedPf });
        };

        const renderActionList = (actions: PowerAction[], phase: 'PowerOnActions' | 'PowerOffActions', title: string): React.JSX.Element => {

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
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                            {title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={(): void => handleAdd('IRPressAction')}
                            >
                                IR Command
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={(): void => handleAdd('IRDelayAction')}
                            >
                                Delay
                            </Button>
                        </Box>
                    </Box>
                    {actions.length > 0 ? (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }} align="center">#</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Command / Duration</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Delay (ms)</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {actions.map((action, i) => (
                                    <TableRow key={i}>
                                        <TableCell align="center">{i + 1}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={action.__type === 'IRPressAction' ? 'IR Command' : 'Delay'}
                                                size="small"
                                                color={action.__type === 'IRPressAction' ? 'primary' : 'default'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {action.__type === 'IRPressAction' ? (
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
                                                    value={action.Duration ?? 0}
                                                    onChange={(e): void => handleDurationChange(i, Number(e.target.value))}
                                                    size="small"
                                                    sx={{ width: 120 }}
                                                    slotProps={{ input: { endAdornment: <Typography variant="caption">ms</Typography> } }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                type="number"
                                                value={action.Delay ?? 0}
                                                onChange={(e): void => handleDelayChange(i, Number(e.target.value))}
                                                size="small"
                                                sx={{ width: 100 }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
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
                                            <Tooltip title="Delete">
                                                <IconButton size="small" color="error" onClick={(): void => handleDelete(i)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No actions defined.
                        </Typography>
                    )}
                </Box>
            );
        };

        return (
            <Box>
                {renderActionList(pf.PowerOnActions || [], 'PowerOnActions', 'Power On Actions')}
                <Divider sx={{ my: 2 }} />
                {renderActionList(pf.PowerOffActions || [], 'PowerOffActions', 'Power Off Actions')}
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
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Activity</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Power</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Input</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {usedActivities.map((act) => {
                                const rule = act.fixit[device.id];
                                const role = act.roles?.[device.id] || '-';
                                return (
                                    <TableRow key={act.id}>
                                        <TableCell>{act.label}</TableCell>
                                        <TableCell>
                                            <Chip label={role} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>{rule?.Power || '-'}</TableCell>
                                        <TableCell>{rule?.Input || '-'}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
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
            <Typography variant="h6" gutterBottom>
                {device.label}
            </Typography>
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
