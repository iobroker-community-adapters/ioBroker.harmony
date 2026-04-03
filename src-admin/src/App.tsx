import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useHarmonyApi } from './hooks/useHarmonyApi';
import { useResponsive } from './hooks/useResponsive';
import { useConfig } from './hooks/useConfig';
import { MasterDetail } from './components/Layout/MasterDetail';
import { TreeNav, type TreeSelection } from './components/Layout/TreeNav';
import { MobileNav } from './components/Layout/MobileNav';
import { Breadcrumb } from './components/Layout/Breadcrumb';
import { HubOverview } from './components/Hub/HubOverview';
import { ActivityList } from './components/Activity/ActivityList';
import { ActivityEditor } from './components/Activity/ActivityEditor';
import { DeviceList } from './components/Device/DeviceList';
import { DeviceEditor } from './components/Device/DeviceEditor';
import { ConfigToolbar } from './components/Config/ConfigToolbar';
import { UnsavedBanner } from './components/Config/UnsavedBanner';
import { exportConfig, triggerImport } from './components/Config/ExportImport';
import type { HarmonyHubInfo, HarmonyConfig, HarmonyActivity, HarmonyDevice } from './types/harmony';

function App(): React.JSX.Element {
    const api = useHarmonyApi();
    const { isMobile } = useResponsive();
    const configState = useConfig();

    const [hubs, setHubs] = useState<HarmonyHubInfo[]>([]);
    const [configs, setConfigs] = useState<Record<string, HarmonyConfig | null>>({});
    const [selection, setSelection] = useState<TreeSelection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeHub, setActiveHub] = useState<string | null>(null);

    // Load hubs on mount
    useEffect(() => {
        const timer = setTimeout(async () => {
            const resp = await api.getHubs();
            setLoading(false);
            if (resp.success && Array.isArray(resp.data)) {
                const hubList = resp.data;
                setHubs(hubList);

                // Load config for each hub
                for (const hub of hubList) {
                    const configResp = await api.getConfig(hub.name);
                    if (configResp.success && configResp.data) {
                        setConfigs((prev) => ({ ...prev, [hub.name]: configResp.data as HarmonyConfig }));
                    }
                }

                // Auto-select first hub
                if (hubList.length > 0 && !selection) {
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

    // Use config from useConfig if available, otherwise fall back to raw configs
    const currentConfig = configState.config;

    // Build hub data for TreeNav and MobileNav - use the working config
    const hubData = useMemo(() =>
        hubs.map((h) => ({
            name: h.name,
            connected: h.connected,
            config: (h.name === activeHub && currentConfig) ? currentConfig : (configs[h.name] ?? null),
        })),
    [hubs, configs, activeHub, currentConfig]);

    // Build hubConfigs lookup for Breadcrumb and MobileNav
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
        const resp = await api.writeConfig(activeHub, currentConfig);
        if (resp.success) {
            configState.markSaved();
            // Update the raw configs cache too
            setConfigs((prev) => ({ ...prev, [activeHub]: JSON.parse(JSON.stringify(currentConfig)) as HarmonyConfig }));
        } else {
            alert('Failed to save: ' + (resp.error || 'Unknown error'));
        }
    }, [activeHub, currentConfig, api, configState]);

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

    // Render detail view based on selection
    function renderDetail(): React.JSX.Element {
        if (!selection) {
            return <div style={{ color: '#888', padding: 16 }}>Select a hub, activity, or device from the navigation.</div>;
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
                    />
                );

            case 'activityList':
                return (
                    <ActivityList
                        activities={config?.activity || []}
                        onSelectActivity={(id): void => setSelection({ type: 'activity', hubName: selection.hubName, activityId: id })}
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
                if (!activity) return <div style={{ color: '#888', padding: 16 }}>Activity not found.</div>;
                return (
                    <ActivityEditor
                        activity={activity}
                        allDevices={config?.device || []}
                        onUpdate={handleActivityUpdate}
                    />
                );
            }

            case 'device': {
                const device = config?.device?.find((d) => d.id === selection.deviceId);
                if (!device) return <div style={{ color: '#888', padding: 16 }}>Device not found.</div>;
                return (
                    <DeviceEditor
                        device={device}
                        allActivities={config?.activity || []}
                        onUpdate={handleDeviceUpdate}
                    />
                );
            }
        }
    }

    if (loading) {
        return <div style={{ padding: 32, textAlign: 'center' }}>Loading Harmony hubs...</div>;
    }

    if (error) {
        return <div style={{ padding: 32, color: '#c62828' }}>Error: {error}</div>;
    }

    if (hubs.length === 0) {
        return <div style={{ padding: 32, textAlign: 'center' }}>No hubs found.</div>;
    }

    const masterPanel = isMobile ? (
        <MobileNav
            hubs={hubData}
            selection={selection}
            onSelect={setSelection}
            hubConfigs={hubConfigs}
        />
    ) : (
        <TreeNav
            hubs={hubData}
            selection={selection}
            onSelect={setSelection}
        />
    );

    const showToolbar = selection && selection.hubName === activeHub;

    const detailPanel = (
        <div>
            {!isMobile && <Breadcrumb selection={selection} hubConfigs={hubConfigs} />}
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
        </div>
    );

    return (
        <MasterDetail
            master={masterPanel}
            detail={detailPanel}
            isMobile={isMobile}
        />
    );
}

export default App;
