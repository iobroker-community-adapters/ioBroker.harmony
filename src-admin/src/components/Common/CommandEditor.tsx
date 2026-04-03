import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    TextField,
    MenuItem,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Alert,
    CircularProgress,
    Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import BoltIcon from '@mui/icons-material/Bolt';
import { I18n } from '@iobroker/adapter-react-v5';
import type { HarmonyDevice, CommandFunction } from '../../types/harmony';
import { IRDBSearch } from '../IRDB/IRDBSearch';
import { IRCodeInput } from '../IRDB/IRCodeInput';
import { getDeviceIconSrc } from '../../utils/deviceTypes';
import { getCommandIconSrc } from '../../utils/commandIcons';
import { HarmonyIcon } from './HarmonyIcon';

interface CommandEditorProps {
    open: boolean;
    command?: CommandFunction | null;
    allDevices: HarmonyDevice[];
    hubName: string;
    testCommand?: (hubName: string, deviceId: string, command: string) => Promise<{ success: boolean }>;
    onSave: (command: CommandFunction) => void;
    onClose: () => void;
}

interface ActionData {
    command: string;
    type: string;
    deviceId: string;
}

function parseActionJson(actionStr: string): ActionData {
    try {
        const parsed = JSON.parse(actionStr);
        return {
            command: parsed.command || '',
            type: parsed.type || 'IRCommand',
            deviceId: parsed.deviceId || '',
        };
    } catch {
        return { command: '', type: 'IRCommand', deviceId: '' };
    }
}

function buildActionJson(data: ActionData): string {
    if (!data.command && !data.deviceId) return '{}';
    const obj: Record<string, string> = {};
    if (data.command) obj.command = data.command;
    if (data.type) obj.type = data.type;
    if (data.deviceId) obj.deviceId = data.deviceId;
    return JSON.stringify(obj);
}

const COMMAND_TYPES = ['IRCommand', 'IRPressAction', 'IRDelayAction'];

export function CommandEditor({
    open,
    command,
    allDevices,
    hubName,
    testCommand,
    onSave,
    onClose,
}: CommandEditorProps): React.JSX.Element {
    const isNew = !command;
    const [activeTab, setActiveTab] = useState(0);
    const [name, setName] = useState('');
    const [label, setLabel] = useState('');
    const [actionData, setActionData] = useState<ActionData>({ command: '', type: 'IRCommand', deviceId: '' });
    const [rawAction, setRawAction] = useState('{}');
    const [rawMode, setRawMode] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    // IRDB state
    const [irdbCodes, setIrdbCodes] = useState<Array<{ name: string; functionCode: string }>>([]);
    const [irdbMeta, setIrdbMeta] = useState<{ manufacturer: string; deviceType: string; model: string } | null>(null);

    // Hub commands browsing state
    const [selectedDeviceId, setSelectedDeviceId] = useState('');

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            if (command) {
                setName(command.name);
                setLabel(command.label);
                const parsed = parseActionJson(command.action);
                setActionData(parsed);
                setRawAction(command.action || '{}');
                setSelectedDeviceId(parsed.deviceId);
            } else {
                setName('');
                setLabel('');
                setActionData({ command: '', type: 'IRCommand', deviceId: '' });
                setRawAction('{}');
                setSelectedDeviceId('');
            }
            setActiveTab(0);
            setRawMode(false);
            setTestStatus('idle');
            setIrdbCodes([]);
            setIrdbMeta(null);
        }
    }, [open, command]);

    const actionJson = useMemo(() => {
        if (rawMode) return rawAction;
        return buildActionJson(actionData);
    }, [rawMode, rawAction, actionData]);

    const handleSelectHubCommand = useCallback((device: HarmonyDevice, fn: { name: string; label: string; action: string }) => {
        setName(fn.name);
        setLabel(fn.label);
        try {
            const parsed = JSON.parse(fn.action);
            setActionData({
                command: parsed.command || fn.name,
                type: parsed.type || 'IRCommand',
                deviceId: parsed.deviceId || device.id,
            });
            setRawAction(fn.action);
        } catch {
            setActionData({
                command: fn.name,
                type: 'IRCommand',
                deviceId: device.id,
            });
            setRawAction(buildActionJson({ command: fn.name, type: 'IRCommand', deviceId: device.id }));
        }
    }, []);

    const handleIRDBCodeSetSelected = useCallback((manufacturer: string, deviceType: string, model: string, codes: Array<{ name: string; functionCode: string }>) => {
        setIrdbCodes(codes);
        setIrdbMeta({ manufacturer, deviceType, model });
    }, []);

    const handleSelectIRDBCommand = useCallback((code: { name: string; functionCode: string }) => {
        setName(code.name);
        setLabel(code.name);
        setActionData({
            command: code.name,
            type: 'IRCommand',
            deviceId: actionData.deviceId,
        });
        setRawAction(buildActionJson({
            command: code.name,
            type: 'IRCommand',
            deviceId: actionData.deviceId,
        }));
    }, [actionData.deviceId]);

    const handleAddManualIRCode = useCallback((codeName: string, _prontoCode: string) => {
        setName(codeName);
        setLabel(codeName);
        setActionData({
            command: codeName,
            type: 'IRCommand',
            deviceId: actionData.deviceId,
        });
    }, [actionData.deviceId]);

    const handleTest = useCallback(async () => {
        if (!testCommand || !actionData.deviceId || !actionData.command) return;
        setTestStatus('testing');
        try {
            const result = await testCommand(hubName, actionData.deviceId, actionData.command);
            setTestStatus(result.success ? 'success' : 'error');
        } catch {
            setTestStatus('error');
        }
        setTimeout(() => setTestStatus('idle'), 3000);
    }, [testCommand, hubName, actionData]);

    const handleSave = useCallback(() => {
        const result: CommandFunction = {
            name: name.trim() || `Command_${Date.now()}`,
            label: label.trim() || name.trim() || 'Command',
            action: actionJson,
        };
        onSave(result);
    }, [name, label, actionJson, onSave]);

    const canSave = name.trim().length > 0;

    const selectedDevice = allDevices.find((d) => d.id === selectedDeviceId);

    // ---- Tab 1: Hub Commands ----
    const renderHubCommands = (): React.JSX.Element => (
        <Box>
            <TextField
                select
                label={I18n.t('selectDevice')}
                value={selectedDeviceId}
                onChange={(e): void => setSelectedDeviceId(e.target.value)}
                fullWidth
                size="small"
                sx={{ mb: 2 }}
            >
                <MenuItem value="">
                    <em>--</em>
                </MenuItem>
                {allDevices.map((dev) => (
                    <MenuItem key={dev.id} value={dev.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HarmonyIcon src={getDeviceIconSrc(dev.type)} alt={dev.label} size={20} />
                            {dev.label}
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                                {dev.manufacturer} {dev.model}
                            </Typography>
                        </Box>
                    </MenuItem>
                ))}
            </TextField>

            {selectedDevice && (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: 32 }}></TableCell>
                                <TableCell>{I18n.t('name')}</TableCell>
                                <TableCell>{I18n.t('label')}</TableCell>
                                <TableCell>{I18n.t('group')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(selectedDevice.controlGroup || []).map((cg) =>
                                cg.function.map((fn) => {
                                    const cmdIconSrc = getCommandIconSrc(fn.name);
                                    const isSelected = name === fn.name && actionData.deviceId === selectedDevice.id;
                                    return (
                                        <TableRow
                                            key={`${cg.name}-${fn.name}`}
                                            hover
                                            selected={isSelected}
                                            onClick={(): void => handleSelectHubCommand(selectedDevice, fn)}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell sx={{ width: 32, px: 1 }}>
                                                {cmdIconSrc ? (
                                                    <HarmonyIcon src={cmdIconSrc} alt={fn.name} size={18} />
                                                ) : (
                                                    <BoltIcon fontSize="small" color="disabled" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                                                    {fn.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{fn.label}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={cg.name} size="small" variant="outlined" />
                                            </TableCell>
                                        </TableRow>
                                    );
                                }),
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {selectedDeviceId && !selectedDevice && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    {I18n.t('noCommands')}
                </Typography>
            )}

            {!selectedDeviceId && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    {I18n.t('selectDevice')}
                </Typography>
            )}
        </Box>
    );

    // ---- Tab 2: IR Database ----
    const renderIRDatabase = (): React.JSX.Element => (
        <Box>
            <IRDBSearch onSelectCodeSet={handleIRDBCodeSetSelected} />

            {irdbMeta && irdbCodes.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 1.5 }} />
                    <Typography variant="subtitle2" gutterBottom>
                        {irdbMeta.manufacturer} - {irdbMeta.model} ({irdbCodes.length} {I18n.t('commands').toLowerCase()})
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200, mb: 2 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>{I18n.t('name')}</TableCell>
                                    <TableCell>Code</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {irdbCodes.map((code) => {
                                    const isSelected = name === code.name;
                                    return (
                                        <TableRow
                                            key={code.name}
                                            hover
                                            selected={isSelected}
                                            onClick={(): void => handleSelectIRDBCommand(code)}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                                                    {code.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                                                    {code.functionCode.substring(0, 40)}...
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            <Divider sx={{ my: 2 }} />
            <IRCodeInput onAddCode={handleAddManualIRCode} />
        </Box>
    );

    // ---- Tab 3: Manual ----
    const renderManual = (): React.JSX.Element => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label={I18n.t('commandName')}
                value={name}
                onChange={(e): void => setName(e.target.value)}
                fullWidth
                size="small"
            />
            <TextField
                label={I18n.t('label')}
                value={label}
                onChange={(e): void => setLabel(e.target.value)}
                fullWidth
                size="small"
            />
            <TextField
                label="Device ID"
                value={actionData.deviceId}
                onChange={(e): void => setActionData((prev) => ({ ...prev, deviceId: e.target.value }))}
                fullWidth
                size="small"
                select
            >
                <MenuItem value="">
                    <em>--</em>
                </MenuItem>
                {allDevices.map((dev) => (
                    <MenuItem key={dev.id} value={dev.id}>
                        {dev.label} ({dev.id})
                    </MenuItem>
                ))}
            </TextField>
            <TextField
                label={I18n.t('type')}
                value={actionData.type}
                onChange={(e): void => setActionData((prev) => ({ ...prev, type: e.target.value }))}
                fullWidth
                size="small"
                select
            >
                {COMMAND_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
            </TextField>
            <TextField
                label={I18n.t('rawAction')}
                value={rawMode ? rawAction : actionJson}
                onChange={(e): void => {
                    setRawMode(true);
                    setRawAction(e.target.value);
                }}
                onFocus={(): void => {
                    if (!rawMode) {
                        setRawAction(actionJson);
                    }
                }}
                fullWidth
                size="small"
                multiline
                minRows={3}
                maxRows={6}
                slotProps={{ input: { sx: { fontFamily: 'monospace', fontSize: 12 } } }}
                helperText={I18n.t('rawActionHelp')}
            />
        </Box>
    );

    const tabContent = [renderHubCommands, renderIRDatabase, renderManual];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { minHeight: 520 } }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Typography variant="h6">
                    {isNew ? I18n.t('addCommand') : I18n.t('editCommand')}
                </Typography>
                <IconButton size="small" onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 0 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, val): void => setActiveTab(val)}
                    sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label={I18n.t('hubCommands')} />
                    <Tab label={I18n.t('irDatabase')} />
                    <Tab label={I18n.t('manual')} />
                </Tabs>

                <Box sx={{ p: 2, minHeight: 300 }}>
                    {tabContent[activeTab]()}
                </Box>

                {/* Action Preview */}
                <Divider />
                <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {I18n.t('actionPreview')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                            {name && (
                                <Chip label={name} size="small" color="primary" variant="outlined" />
                            )}
                            {label && label !== name && (
                                <Typography variant="body2" color="text.secondary">
                                    "{label}"
                                </Typography>
                            )}
                        </Box>
                        <Typography
                            variant="caption"
                            sx={{
                                fontFamily: 'monospace',
                                bgcolor: 'background.paper',
                                px: 1,
                                py: 0.5,
                                borderRadius: 0.5,
                                border: 1,
                                borderColor: 'divider',
                                maxWidth: 400,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                            }}
                        >
                            {actionJson}
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 2, py: 1.5 }}>
                {testCommand && actionData.deviceId && actionData.command && (
                    <Button
                        startIcon={
                            testStatus === 'testing' ? <CircularProgress size={16} /> :
                            testStatus === 'success' ? <CheckCircleIcon /> :
                            testStatus === 'error' ? <ErrorOutlineIcon /> :
                            <PlayArrowIcon />
                        }
                        color={
                            testStatus === 'success' ? 'success' :
                            testStatus === 'error' ? 'error' :
                            'primary'
                        }
                        variant="outlined"
                        size="small"
                        disabled={testStatus === 'testing'}
                        onClick={(): void => { void handleTest(); }}
                        sx={{ mr: 'auto' }}
                    >
                        {I18n.t('test')}
                    </Button>
                )}
                <Button onClick={onClose}>
                    {I18n.t('cancel')}
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={!canSave}
                >
                    {I18n.t('save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
