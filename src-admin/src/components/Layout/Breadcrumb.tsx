import React from 'react';
import type { TreeSelection } from './TreeNav';

interface BreadcrumbProps {
    selection: TreeSelection | null;
    hubConfigs: Record<string, { activities: Record<string, string>; devices: Record<string, string> }>;
}

export function Breadcrumb({ selection, hubConfigs }: BreadcrumbProps): React.JSX.Element {
    if (!selection) {
        return <div style={{ fontSize: 13, color: '#666', padding: '4px 0' }}>No selection</div>;
    }

    const parts: string[] = [selection.hubName];
    const cfg = hubConfigs[selection.hubName];

    switch (selection.type) {
        case 'hub':
            break;
        case 'activityList':
            parts.push('Activities');
            break;
        case 'activity':
            parts.push('Activities');
            parts.push(cfg?.activities[selection.activityId] ?? selection.activityId);
            break;
        case 'deviceList':
            parts.push('Devices');
            break;
        case 'device':
            parts.push('Devices');
            parts.push(cfg?.devices[selection.deviceId] ?? selection.deviceId);
            break;
    }

    return (
        <div style={{ fontSize: 13, color: '#666', padding: '4px 0' }}>
            {parts.join(' \u203A ')}
        </div>
    );
}
