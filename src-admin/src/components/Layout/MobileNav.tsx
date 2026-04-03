import React from 'react';
import type { HarmonyConfig } from '../../types/harmony';
import type { TreeSelection } from './TreeNav';
import { Breadcrumb } from './Breadcrumb';

interface MobileNavProps {
    hubs: Array<{ name: string; connected: boolean; config: HarmonyConfig | null }>;
    selection: TreeSelection | null;
    onSelect: (sel: TreeSelection) => void;
    hubConfigs: Record<string, { activities: Record<string, string>; devices: Record<string, string> }>;
}

function selectionToValue(sel: TreeSelection | null): string {
    if (!sel) return '';
    switch (sel.type) {
        case 'hub':
            return `hub:${sel.hubName}`;
        case 'activityList':
            return `activityList:${sel.hubName}`;
        case 'activity':
            return `activity:${sel.hubName}:${sel.activityId}`;
        case 'deviceList':
            return `deviceList:${sel.hubName}`;
        case 'device':
            return `device:${sel.hubName}:${sel.deviceId}`;
    }
}

function valueToSelection(value: string): TreeSelection | null {
    const parts = value.split(':');
    const type = parts[0];
    const hubName = parts[1];
    if (!type || !hubName) return null;

    switch (type) {
        case 'hub':
            return { type: 'hub', hubName };
        case 'activityList':
            return { type: 'activityList', hubName };
        case 'activity':
            return { type: 'activity', hubName, activityId: parts.slice(2).join(':') };
        case 'deviceList':
            return { type: 'deviceList', hubName };
        case 'device':
            return { type: 'device', hubName, deviceId: parts.slice(2).join(':') };
        default:
            return null;
    }
}

export function MobileNav({ hubs, selection, onSelect, hubConfigs }: MobileNavProps): React.JSX.Element {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        const sel = valueToSelection(e.target.value);
        if (sel) onSelect(sel);
    };

    return (
        <div style={{ padding: 8 }}>
            <select
                value={selectionToValue(selection)}
                onChange={handleChange}
                style={{ width: '100%', padding: '8px 4px', fontSize: 14, borderRadius: 4, border: '1px solid #ccc' }}
            >
                <option value="" disabled>
                    Select...
                </option>
                {hubs.map((hub) => {
                    const config = hub.config;
                    const activities = config
                        ? config.activity.filter((a) => a.id !== '-1')
                        : [];
                    const devices = config ? config.device : [];
                    const status = hub.connected ? '\u{1F7E2}' : '\u{1F534}';

                    return (
                        <optgroup key={hub.name} label={`${status} ${hub.name}`}>
                            <option value={`hub:${hub.name}`}>
                                Hub Overview
                            </option>
                            <option value={`activityList:${hub.name}`}>
                                All Activities ({activities.length})
                            </option>
                            {activities.map((act) => (
                                <option key={act.id} value={`activity:${hub.name}:${act.id}`}>
                                    {'\u00A0\u00A0'}{act.label}
                                </option>
                            ))}
                            <option value={`deviceList:${hub.name}`}>
                                All Devices ({devices.length})
                            </option>
                            {devices.map((dev) => (
                                <option key={dev.id} value={`device:${hub.name}:${dev.id}`}>
                                    {'\u00A0\u00A0'}{dev.label}
                                </option>
                            ))}
                        </optgroup>
                    );
                })}
            </select>
            <Breadcrumb selection={selection} hubConfigs={hubConfigs} />
        </div>
    );
}
