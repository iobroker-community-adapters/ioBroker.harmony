import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Select,
    MenuItem,
    Button,
    Card,
    CardContent,
    Switch,
    FormControlLabel,
    Divider,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import SaveIcon from '@mui/icons-material/Save';
import { I18n } from '@iobroker/adapter-react-v5';
import type { HarmonyGlobal } from '../../types/harmony';

interface HubSettingsProps {
    hubName: string;
    friendlyName: string;
    global: HarmonyGlobal | null;
    discoveryInfo?: Record<string, string>;
    stateDigest?: Record<string, unknown>;
    onUpdateGlobal: (updated: HarmonyGlobal) => void;
    onRenameHub: (newName: string) => void;
    onSetSleepTimer: (minutes: number) => void;
}

const LOCALE_OPTIONS = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'de-DE', label: 'Deutsch' },
    { value: 'fr-FR', label: 'Français' },
    { value: 'es-ES', label: 'Español' },
    { value: 'it-IT', label: 'Italiano' },
    { value: 'nl-NL', label: 'Nederlands' },
    { value: 'pt-BR', label: 'Português (BR)' },
    { value: 'ja-JP', label: '日本語' },
    { value: 'zh-CN', label: '中文' },
    { value: 'ko-KR', label: '한국어' },
    { value: 'ru-RU', label: 'Русский' },
];

const SLEEP_OPTIONS = [
    { value: 0, label: 'Off' },
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '1 h' },
    { value: 90, label: '1.5 h' },
    { value: 120, label: '2 h' },
    { value: 180, label: '3 h' },
    { value: 240, label: '4 h' },
];

export function HubSettings({
    hubName: _hubName,
    friendlyName,
    global,
    discoveryInfo,
    stateDigest,
    onUpdateGlobal,
    onRenameHub,
    onSetSleepTimer,
}: HubSettingsProps): React.JSX.Element {
    const [hubNameEdit, setHubNameEdit] = useState(friendlyName);
    const [hubNameDirty, setHubNameDirty] = useState(false);

    const sleepTimerId = (stateDigest?.sleepTimerId as number) || 0;
    const oohEnabled = discoveryInfo?.oohEnabled === 'true';

    const handleHubNameChange = (value: string): void => {
        setHubNameEdit(value);
        setHubNameDirty(value !== friendlyName);
    };

    const handleHubNameSave = (): void => {
        onRenameHub(hubNameEdit);
        setHubNameDirty(false);
    };

    const handleLocaleChange = (locale: string): void => {
        if (global) {
            onUpdateGlobal({ ...global, locale });
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>{I18n.t('settings')}</Typography>

            <Grid2 container spacing={2}>
                {/* Hub Name */}
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                {I18n.t('hubName')}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField
                                    value={hubNameEdit}
                                    onChange={(e): void => handleHubNameChange(e.target.value)}
                                    size="small"
                                    fullWidth
                                    label={I18n.t('name')}
                                />
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<SaveIcon />}
                                    disabled={!hubNameDirty}
                                    onClick={handleHubNameSave}
                                >
                                    {I18n.t('save')}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid2>

                {/* Locale */}
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                {I18n.t('locale')}
                            </Typography>
                            <Select
                                value={global?.locale || ''}
                                onChange={(e): void => handleLocaleChange(e.target.value)}
                                size="small"
                                fullWidth
                            >
                                {LOCALE_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                                {global?.locale && !LOCALE_OPTIONS.find((o) => o.value === global.locale) && (
                                    <MenuItem value={global.locale}>{global.locale}</MenuItem>
                                )}
                            </Select>
                        </CardContent>
                    </Card>
                </Grid2>

                {/* Sleep Timer */}
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                {I18n.t('sleepTimer')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {I18n.t('sleepTimerDesc')}
                            </Typography>
                            <Select
                                value={sleepTimerId > 0 ? sleepTimerId : 0}
                                onChange={(e): void => onSetSleepTimer(Number(e.target.value))}
                                size="small"
                                fullWidth
                            >
                                {SLEEP_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                            </Select>
                        </CardContent>
                    </Card>
                </Grid2>

                {/* Remote Access */}
                <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                {I18n.t('outOfHome')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {I18n.t('outOfHomeDesc')}
                            </Typography>
                            <FormControlLabel
                                control={<Switch checked={oohEnabled} disabled />}
                                label={oohEnabled ? I18n.t('yes') : I18n.t('no')}
                            />
                            <Typography variant="caption" color="text.secondary" display="block">
                                {I18n.t('outOfHomeReadOnly')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid2>
            </Grid2>
        </Box>
    );
}
