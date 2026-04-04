import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    IconButton,
    Button,
    Tooltip,
    Select,
    MenuItem,
    Card,
    CardContent,
    InputAdornment,
    Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import BoltIcon from '@mui/icons-material/Bolt';
import TimerIcon from '@mui/icons-material/Timer';
import { I18n } from '@iobroker/adapter-react-v5';
import type { HarmonySequence, SequenceAction, HarmonyDevice } from '../../types/harmony';
import { getDeviceIconSrc } from '../../utils/deviceTypes';
import { getCommandIconSrc } from '../../utils/commandIcons';
import { HarmonyIcon } from '../Common/HarmonyIcon';

interface SequenceEditorProps {
    sequence: HarmonySequence;
    allDevices: HarmonyDevice[];
    onUpdate: (updated: HarmonySequence) => void;
}

export function SequenceEditor({ sequence, allDevices, onUpdate }: SequenceEditorProps): React.JSX.Element {
    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState(sequence.name);

    const actions = sequence.sequenceActions || [];

    const deviceCommands: Record<string, string[]> = {};
    for (const dev of allDevices) {
        const cmds: string[] = [];
        for (const cg of dev.controlGroup || []) {
            for (const fn of cg.function) {
                cmds.push(fn.name);
            }
        }
        deviceCommands[dev.id] = cmds;
    }

    const updateActions = (newActions: SequenceAction[]): void => {
        onUpdate({ ...sequence, sequenceActions: newActions });
    };

    const handleAddAction = (): void => {
        const defaultDeviceId = allDevices.length > 0 ? allDevices[0].id : '';
        const defaultCmd = defaultDeviceId && deviceCommands[defaultDeviceId]?.length > 0
            ? deviceCommands[defaultDeviceId][0]
            : '';
        const newAction: SequenceAction = {
            type: 'IRPressAction',
            deviceId: defaultDeviceId,
            command: defaultCmd,
            duration: 100,
            delay: 0,
        };
        updateActions([...actions, newAction]);
    };

    const handleAddDelay = (): void => {
        const newAction: SequenceAction = {
            type: 'IRDelayAction',
            deviceId: '',
            command: '',
            duration: 0,
            delay: 500,
        };
        updateActions([...actions, newAction]);
    };

    const handleDelete = (index: number): void => {
        updateActions(actions.filter((_, i) => i !== index));
    };

    const handleMoveUp = (index: number): void => {
        if (index === 0) return;
        const arr = [...actions];
        [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
        updateActions(arr);
    };

    const handleMoveDown = (index: number): void => {
        if (index >= actions.length - 1) return;
        const arr = [...actions];
        [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
        updateActions(arr);
    };

    const handleActionChange = (index: number, field: keyof SequenceAction, value: string | number): void => {
        const arr = [...actions];
        arr[index] = { ...arr[index], [field]: value };
        // If device changed, reset command to first available
        if (field === 'deviceId' && typeof value === 'string') {
            const cmds = deviceCommands[value] || [];
            arr[index].command = cmds.length > 0 ? cmds[0] : '';
        }
        updateActions(arr);
    };

    const handleSaveName = (): void => {
        onUpdate({ ...sequence, name: nameValue });
        setEditingName(false);
    };

    return (
        <Box>
            {/* Sequence name */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {editingName ? (
                    <>
                        <TextField
                            value={nameValue}
                            onChange={(e): void => setNameValue(e.target.value)}
                            size="small"
                            autoFocus
                            onKeyDown={(e): void => {
                                if (e.key === 'Enter') handleSaveName();
                                if (e.key === 'Escape') { setEditingName(false); setNameValue(sequence.name); }
                            }}
                        />
                        <Button size="small" onClick={handleSaveName}>{I18n.t('save')}</Button>
                        <Button size="small" onClick={(): void => { setEditingName(false); setNameValue(sequence.name); }}>{I18n.t('cancel')}</Button>
                    </>
                ) : (
                    <>
                        <Typography variant="h6">{sequence.name}</Typography>
                        <Button size="small" onClick={(): void => setEditingName(true)}>{I18n.t('edit')}</Button>
                    </>
                )}
            </Box>

            {/* Action timeline */}
            {actions.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {I18n.t('noCommands')}
                </Typography>
            ) : (
                <Box sx={{ pl: 2 }}>
                    {actions.map((action, i) => {
                        const isDelay = action.type === 'IRDelayAction';
                        const device = allDevices.find((d) => d.id === action.deviceId);
                        const cmdIconSrc = !isDelay && action.command ? getCommandIconSrc(action.command) : undefined;

                        return (
                            <Box key={i} sx={{ display: 'flex', gap: 0 }}>
                                {/* Connector */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 1.5, width: 20 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: isDelay ? 'warning.main' : 'primary.main', mt: 2 }} />
                                    {i < actions.length - 1 && <Box sx={{ width: 2, flex: 1, bgcolor: 'divider' }} />}
                                </Box>
                                {/* Step card */}
                                <Card variant="outlined" sx={{ flex: 1, mb: 1, borderLeft: 3, borderLeftColor: isDelay ? 'warning.main' : 'primary.main' }}>
                                    <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                            {isDelay ? (
                                                <TimerIcon fontSize="small" color="warning" />
                                            ) : (
                                                cmdIconSrc ? <HarmonyIcon src={cmdIconSrc} alt={action.command} size={20} /> : <BoltIcon fontSize="small" color="primary" />
                                            )}
                                            <Typography variant="body2" fontWeight={500} sx={{ minWidth: 50 }}>
                                                {I18n.t('step')} {i + 1}
                                            </Typography>
                                            {isDelay ? (
                                                <TextField
                                                    type="number"
                                                    value={action.delay}
                                                    onChange={(e): void => handleActionChange(i, 'delay', Number(e.target.value))}
                                                    size="small"
                                                    sx={{ width: 120 }}
                                                    slotProps={{ input: { endAdornment: <InputAdornment position="end">ms</InputAdornment> } }}
                                                />
                                            ) : (
                                                <>
                                                    <Select
                                                        value={action.deviceId}
                                                        onChange={(e): void => handleActionChange(i, 'deviceId', e.target.value)}
                                                        size="small"
                                                        sx={{ minWidth: 140 }}
                                                    >
                                                        {allDevices.map((dev) => (
                                                            <MenuItem key={dev.id} value={dev.id}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <HarmonyIcon src={getDeviceIconSrc(dev.type)} alt={dev.label} size={18} />
                                                                    {dev.label}
                                                                </Box>
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    <Select
                                                        value={action.command}
                                                        onChange={(e): void => handleActionChange(i, 'command', e.target.value)}
                                                        size="small"
                                                        sx={{ minWidth: 140 }}
                                                    >
                                                        {(deviceCommands[action.deviceId] || []).map((cmd) => (
                                                            <MenuItem key={cmd} value={cmd}>{cmd}</MenuItem>
                                                        ))}
                                                        {action.command && !(deviceCommands[action.deviceId] || []).includes(action.command) && (
                                                            <MenuItem value={action.command}>{action.command}</MenuItem>
                                                        )}
                                                    </Select>
                                                    <TextField
                                                        type="number"
                                                        value={action.duration}
                                                        onChange={(e): void => handleActionChange(i, 'duration', Number(e.target.value))}
                                                        size="small"
                                                        sx={{ width: 100 }}
                                                        label={I18n.t('delay') + ' (ms)'}
                                                    />
                                                </>
                                            )}
                                            <Box sx={{ ml: 'auto', display: 'flex' }}>
                                                <Tooltip title={I18n.t('moveUp')}>
                                                    <span>
                                                        <IconButton size="small" disabled={i === 0} onClick={(): void => handleMoveUp(i)}>
                                                            <ArrowUpwardIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title={I18n.t('moveDown')}>
                                                    <span>
                                                        <IconButton size="small" disabled={i >= actions.length - 1} onClick={(): void => handleMoveDown(i)}>
                                                            <ArrowDownwardIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title={I18n.t('delete')}>
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

            {/* Add buttons */}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button size="small" variant="outlined" color="primary" startIcon={<BoltIcon />} onClick={handleAddAction}>
                    {I18n.t('addIRCommand')}
                </Button>
                <Button size="small" variant="outlined" color="warning" startIcon={<TimerIcon />} onClick={handleAddDelay}>
                    {I18n.t('addDelay')}
                </Button>
            </Box>
        </Box>
    );
}
