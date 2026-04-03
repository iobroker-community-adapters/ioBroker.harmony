import React, { useEffect, useState, useMemo } from 'react';
import { useHarmonyApi } from './hooks/useHarmonyApi';
import { useResponsive } from './hooks/useResponsive';
import { MasterDetail } from './components/Layout/MasterDetail';
import { TreeNav, type TreeSelection } from './components/Layout/TreeNav';
import { MobileNav } from './components/Layout/MobileNav';
import { Breadcrumb } from './components/Layout/Breadcrumb';
import { HubOverview } from './components/Hub/HubOverview';
import { ActivityList } from './components/Activity/ActivityList';
import { DeviceList } from './components/Device/DeviceList';
import type { HarmonyHubInfo, HarmonyConfig } from './types/harmony';

function App(): React.JSX.Element {
    const api = useHarmonyApi();
    const { isMobile } = useResponsive();

    const [hubs, setHubs] = useState<HarmonyHubInfo[]>([]);
    const [configs, setConfigs] = useState<Record<string, HarmonyConfig | null>>({});
    const [selection, setSelection] = useState<TreeSelection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    // Build hub data for TreeNav and MobileNav
    const hubData = useMemo(() =>
        hubs.map((h) => ({
            name: h.name,
            connected: h.connected,
            config: configs[h.name] ?? null,
        })),
    [hubs, configs]);

    // Build hubConfigs lookup for Breadcrumb and MobileNav
    const hubConfigs = useMemo(() => {
        const result: Record<string, { activities: Record<string, string>; devices: Record<string, string> }> = {};
        for (const hub of hubs) {
            const config = configs[hub.name];
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
    }, [hubs, configs]);

    // Render detail view based on selection
    function renderDetail(): React.JSX.Element {
        if (!selection) {
            return <div style={{ color: '#888', padding: 16 }}>Select a hub, activity, or device from the navigation.</div>;
        }

        const config = configs[selection.hubName] ?? null;
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
                return (
                    <div>
                        <h4 style={{ margin: '0 0 16px' }}>{activity?.label || 'Activity'}</h4>
                        <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 12 }}>
                            {JSON.stringify(activity, null, 2)}
                        </pre>
                    </div>
                );
            }

            case 'device': {
                const device = config?.device?.find((d) => d.id === selection.deviceId);
                return (
                    <div>
                        <h4 style={{ margin: '0 0 16px' }}>{device?.label || 'Device'}</h4>
                        <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 12 }}>
                            {JSON.stringify(device, null, 2)}
                        </pre>
                    </div>
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

    const detailPanel = (
        <div>
            {!isMobile && <Breadcrumb selection={selection} hubConfigs={hubConfigs} />}
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
