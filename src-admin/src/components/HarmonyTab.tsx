import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Snackbar,
    Alert,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import type { AdminConnection } from '@iobroker/adapter-react-v5';
import { I18n } from '@iobroker/adapter-react-v5';
import { useConfig } from '../hooks/useConfig';
import { MasterDetail } from './Layout/MasterDetail';
import { TreeNav, type TreeSelection } from './Layout/TreeNav';
import { Breadcrumb } from './Layout/Breadcrumb';
import { HubOverview } from './Hub/HubOverview';
import { ActivityList } from './Activity/ActivityList';
import { ActivityEditor } from './Activity/ActivityEditor';
import { DeviceList } from './Device/DeviceList';
import { DeviceEditor } from './Device/DeviceEditor';
import { ConfigToolbar } from './Config/ConfigToolbar';
import { UnsavedBanner } from './Config/UnsavedBanner';
import { exportConfig, triggerImport } from './Config/ExportImport';
import type { HarmonyHubInfo, HarmonyConfig, HarmonyActivity, HarmonyDevice } from '../types/harmony';

interface HarmonyTabProps {
    socket: AdminConnection;
    themeType: string;
    theme: Theme;
    adapterName: string;
    instance: number;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export default function HarmonyTab({ socket, themeType, theme, adapterName, instance }: HarmonyTabProps): React.JSX.Element {
    const configState = useConfig();

    const [hubs, setHubs] = useState<HarmonyHubInfo[]>([]);
    const [configs, setConfigs] = useState<Record<string, HarmonyConfig | null>>({});
    const [selection, setSelection] = useState<TreeSelection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeHub, setActiveHub] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success',
    });

    const namespace = `${adapterName}.${instance}`;

    const sendCommand = useCallback(<T,>(command: string, payload: unknown = {}): Promise<ApiResponse<T>> => {
        return new Promise((resolve) => {
            socket.sendTo(namespace, command, payload)
                .then((response: unknown) => {
                    resolve(response as ApiResponse<T>);
                })
                .catch((err: unknown) => {
                    resolve({ success: false, error: String(err) });
                });
        });
    }, [socket, namespace]);

    // Load hubs on mount
    useEffect(() => {
        const timer = setTimeout(async () => {
            const resp = await sendCommand<HarmonyHubInfo[]>('getHubs');
            setLoading(false);
            if (resp.success && Array.isArray(resp.data)) {
                const hubList = resp.data;
                setHubs(hubList);

                for (const hub of hubList) {
                    const configResp = await sendCommand<HarmonyConfig>('getConfig', { hubName: hub.name });
                    if (configResp.success && configResp.data) {
                        setConfigs((prev) => ({ ...prev, [hub.name]: configResp.data as HarmonyConfig }));
                    }
                }

                if (hubList.length > 0) {
                    setSelection({ type: 'hub', hubName: hubList[0].name });
                }
            } else {
                setError(resp.error || 'Failed to load hubs');
            }
        }, 500);
        return (): void => { clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load config into useConfig when selection hub changes
    useEffect(() => {
        const hubName = selection?.hubName ?? null;
        if (hubName && hubName !== activeHub) {
            const config = configs[hubName];
            if (config) {
                configState.loadConfig(config);
                setActiveHub(hubName);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selection?.hubName, configs]);

    const currentConfig = configState.config;

    const hubData = useMemo(() =>
        hubs.map((h) => ({
            name: h.name,
            friendlyName: h.friendlyName || h.name,
            connected: h.connected,
            config: (h.name === activeHub && currentConfig) ? currentConfig : (configs[h.name] ?? null),
        })),
    [hubs, configs, activeHub, currentConfig]);

    const hubConfigs = useMemo(() => {
        const result: Record<string, { activities: Record<string, string>; devices: Record<string, string> }> = {};
        for (const hub of hubs) {
            const config = (hub.name === activeHub && currentConfig) ? currentConfig : configs[hub.name];
            const activities: Record<string, string> = {};
            const devices: Record<string, string> = {};
            if (config) {
                for (const act of config.activity) {
                    activities[act.id] = act.label;
                }
                for (const dev of config.device) {
                    devices[dev.id] = dev.label;
                }
            }
            result[hub.name] = { activities, devices };
        }
        return result;
    }, [hubs, configs, activeHub, currentConfig]);

    const handleSave = useCallback(async (): Promise<void> => {
        if (!activeHub || !currentConfig) return;
        const resp = await sendCommand<unknown>('writeConfig', { hubName: activeHub, changes: currentConfig });
        if (resp.success) {
            configState.markSaved();
            setConfigs((prev) => ({ ...prev, [activeHub]: JSON.parse(JSON.stringify(currentConfig)) as HarmonyConfig }));
            setSnackbar({ open: true, message: 'Configuration saved successfully', severity: 'success' });
        } else {
            setSnackbar({ open: true, message: 'Failed to save: ' + (resp.error || 'Unknown error'), severity: 'error' });
        }
    }, [activeHub, currentConfig, sendCommand, configState]);

    const handleExport = useCallback((): void => {
        if (!activeHub || !currentConfig) return;
        exportConfig(activeHub, currentConfig);
    }, [activeHub, currentConfig]);

    const handleImport = useCallback((): void => {
        triggerImport((imported: HarmonyConfig) => {
            configState.loadConfig(imported);
        });
    }, [configState]);

    const handleActivityUpdate = useCallback((updated: HarmonyActivity): void => {
        configState.updateConfig((cfg) => ({
            ...cfg,
            activity: cfg.activity.map((a) => a.id === updated.id ? updated : a),
        }));
    }, [configState]);

    const handleDeviceUpdate = useCallback((updated: HarmonyDevice): void => {
        configState.updateConfig((cfg) => ({
            ...cfg,
            device: cfg.device.map((d) => d.id === updated.id ? updated : d),
        }));
    }, [configState]);

    const handleTestCommand = useCallback(async (hubNameArg: string, deviceId: string, command: string): Promise<{ success: boolean }> => {
        const resp = await sendCommand<unknown>('sendCommand', { hubName: hubNameArg, deviceId, command });
        return { success: resp.success };
    }, [sendCommand]);

    function renderDetail(): React.JSX.Element {
        if (!selection) {
            return (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    Select a hub, activity, or device from the navigation.
                </Typography>
            );
        }

        const config = (selection.hubName === activeHub && currentConfig) ? currentConfig : (configs[selection.hubName] ?? null);
        const hub = hubs.find((h) => h.name === selection.hubName);

        switch (selection.type) {
            case 'hub':
                return (
                    <HubOverview
                        hubName={selection.hubName}
                        connected={hub?.connected ?? false}
                        config={config}
                        themeType={themeType}
                    />
                );

            case 'activityList':
                return (
                    <ActivityList
                        activities={config?.activity || []}
                        onSelectActivity={(id): void => setSelection({ type: 'activity', hubName: selection.hubName, activityId: id })}
                        onReorder={(reorderedActivities): void => {
                            configState.updateConfig((cfg) => ({ ...cfg, activity: reorderedActivities }));
                        }}
                    />
                );

            case 'deviceList':
                return (
                    <DeviceList
                        devices={config?.device || []}
                        onSelectDevice={(id): void => setSelection({ type: 'device', hubName: selection.hubName, deviceId: id })}
                    />
                );

            case 'activity': {
                const activity = config?.activity?.find((a) => a.id === selection.activityId);
                if (!activity) {
                    return <Typography color="text.secondary" sx={{ p: 2 }}>Activity not found.</Typography>;
                }
                return (
                    <ActivityEditor
                        activity={activity}
                        allDevices={config?.device || []}
                        onUpdate={handleActivityUpdate}
                        testCommand={handleTestCommand}
                        hubName={selection.hubName}
                    />
                );
            }

            case 'device': {
                const device = config?.device?.find((d) => d.id === selection.deviceId);
                if (!device) {
                    return <Typography color="text.secondary" sx={{ p: 2 }}>Device not found.</Typography>;
                }
                return (
                    <DeviceEditor
                        device={device}
                        allActivities={config?.activity || []}
                        onUpdate={handleDeviceUpdate}
                        testCommand={handleTestCommand}
                        hubName={selection.hubName}
                    />
                );
            }
        }
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                <CircularProgress size={24} />
                <Typography>{I18n.t('loading')}</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (hubs.length === 0) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">{I18n.t('noHubs')}</Typography>
            </Box>
        );
    }

    const showToolbar = selection && selection.hubName === activeHub;

    const masterPanel = (
        <TreeNav
            hubs={hubData}
            selection={selection}
            onSelect={setSelection}
        />
    );

    const detailPanel = (
        <Box>
            <Breadcrumb selection={selection} hubConfigs={hubConfigs} />
            {showToolbar && (
                <ConfigToolbar
                    isDirty={configState.isDirty}
                    changeCount={configState.changeCount}
                    canUndo={configState.canUndo}
                    onSave={handleSave}
                    onCancel={configState.cancel}
                    onUndo={configState.undo}
                    onExport={handleExport}
                    onImport={handleImport}
                />
            )}
            {showToolbar && (
                <UnsavedBanner
                    changeCount={configState.changeCount}
                    visible={configState.isDirty}
                />
            )}
            {renderDetail()}
        </Box>
    );

    return (
        <>
            <MasterDetail
                master={masterPanel}
                detail={detailPanel}
            />
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={(): void => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={(): void => setSnackbar((s) => ({ ...s, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
