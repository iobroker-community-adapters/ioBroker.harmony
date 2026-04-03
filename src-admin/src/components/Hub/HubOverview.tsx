import React from 'react';
import type { HarmonyConfig } from '../../types/harmony';

interface HubOverviewProps {
    hubName: string;
    connected: boolean;
    config: HarmonyConfig | null;
}

export function HubOverview({ hubName, connected, config }: HubOverviewProps): React.JSX.Element {
    const activities = config?.activity?.filter((a) => a.id !== '-1') || [];
    const devices = config?.device || [];
    const totalCommands = devices.reduce((sum, d) => sum + d.controlGroup.reduce((s, cg) => s + cg.function.length, 0), 0);

    return (
        <div>
            <h4 style={{ margin: '0 0 16px' }}>{hubName}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {[
                    { label: 'Status', value: connected ? 'Connected' : 'Offline', color: connected ? '#4caf50' : '#f44336' },
                    { label: 'Activities', value: String(activities.length) },
                    { label: 'Devices', value: String(devices.length) },
                    { label: 'Commands', value: String(totalCommands) },
                    { label: 'Locale', value: config?.global?.locale || '-' },
                ].map((card) => (
                    <div key={card.label} style={{ background: '#f5f5f5', borderRadius: 8, padding: 16 }}>
                        <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#888', marginBottom: 4 }}>{card.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: card.color || '#333' }}>{card.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
