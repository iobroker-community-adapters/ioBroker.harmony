import React, { useState } from 'react';
import type { HarmonyConfig } from '../../types/harmony';

export type TreeSelection =
    | { type: 'hub'; hubName: string }
    | { type: 'activityList'; hubName: string }
    | { type: 'activity'; hubName: string; activityId: string }
    | { type: 'deviceList'; hubName: string }
    | { type: 'device'; hubName: string; deviceId: string };

interface TreeNavProps {
    hubs: Array<{ name: string; connected: boolean; config: HarmonyConfig | null }>;
    selection: TreeSelection | null;
    onSelect: (sel: TreeSelection) => void;
}

function isSelected(selection: TreeSelection | null, candidate: TreeSelection): boolean {
    if (!selection) return false;
    if (selection.type !== candidate.type) return false;
    if (selection.hubName !== candidate.hubName) return false;
    if (selection.type === 'activity' && candidate.type === 'activity') {
        return selection.activityId === candidate.activityId;
    }
    if (selection.type === 'device' && candidate.type === 'device') {
        return selection.deviceId === candidate.deviceId;
    }
    return true;
}

function activityEmoji(type: string): string {
    const lower = type.toLowerCase();
    if (lower.includes('tv') || lower === 'vod') return '\u{1F4FA}';
    if (lower.includes('movie') || lower.includes('dvd') || lower.includes('blu')) return '\u{1F3AC}';
    if (lower.includes('music') || lower.includes('audio')) return '\u{1F3B5}';
    if (lower.includes('game')) return '\u{1F3AE}';
    return '\u26A1';
}

function deviceEmoji(type: string): string {
    const lower = type.toLowerCase();
    if (lower.includes('television') || lower.includes('tv')) return '\u{1F4FA}';
    if (lower.includes('stereo') || lower.includes('receiver') || lower.includes('avr') || lower.includes('audio')) return '\u{1F50A}';
    if (lower.includes('dvd') || lower.includes('blu') || lower.includes('disc')) return '\u{1F4BF}';
    if (lower.includes('game') || lower.includes('console')) return '\u{1F3AE}';
    if (lower.includes('cable') || lower.includes('satellite') || lower.includes('pvr')) return '\u{1F4E1}';
    if (lower.includes('computer') || lower.includes('pc')) return '\u{1F4BB}';
    if (lower.includes('projector')) return '\u{1F4FD}\uFE0F';
    return '\u{1F50C}';
}

const nodeStyle: React.CSSProperties = {
    padding: '4px 8px',
    cursor: 'pointer',
    borderRadius: 4,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    userSelect: 'none',
};

const selectedBg = '#bbdefb';

export function TreeNav({ hubs, selection, onSelect }: TreeNavProps): React.JSX.Element {
    const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        for (const h of hubs) init[h.name] = true;
        return init;
    });

    const toggle = (hubName: string): void => {
        setExpanded((prev) => ({ ...prev, [hubName]: !prev[hubName] }));
    };

    return (
        <div style={{ padding: 8, fontSize: 14 }}>
            {hubs.map((hub) => {
                const config = hub.config;
                const activities = config
                    ? config.activity.filter((a) => a.id !== '-1')
                    : [];
                const devices = config ? config.device : [];
                const isExpanded = expanded[hub.name] ?? true;

                return (
                    <div key={hub.name} style={{ marginBottom: 8 }}>
                        {/* Hub node */}
                        <div
                            style={{
                                ...nodeStyle,
                                fontWeight: 600,
                                background: isSelected(selection, { type: 'hub', hubName: hub.name }) ? selectedBg : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                            onClick={(): void => onSelect({ type: 'hub', hubName: hub.name })}
                        >
                            <span
                                onClick={(e): void => { e.stopPropagation(); toggle(hub.name); }}
                                style={{ cursor: 'pointer', display: 'inline-block', width: 16, textAlign: 'center' }}
                            >
                                {isExpanded ? '\u25BE' : '\u25B8'}
                            </span>
                            <span>{hub.connected ? '\u{1F7E2}' : '\u{1F534}'}</span>
                            <span>{hub.name}</span>
                        </div>

                        {isExpanded && (
                            <div style={{ marginLeft: 16 }}>
                                {/* Activities header */}
                                <div
                                    style={{
                                        ...nodeStyle,
                                        fontWeight: 500,
                                        background: isSelected(selection, { type: 'activityList', hubName: hub.name }) ? selectedBg : 'transparent',
                                    }}
                                    onClick={(): void => onSelect({ type: 'activityList', hubName: hub.name })}
                                >
                                    Activities ({activities.length})
                                </div>

                                {/* Activity children */}
                                <div style={{ marginLeft: 16 }}>
                                    {activities.map((act) => (
                                        <div
                                            key={act.id}
                                            style={{
                                                ...nodeStyle,
                                                background: isSelected(selection, { type: 'activity', hubName: hub.name, activityId: act.id }) ? selectedBg : 'transparent',
                                            }}
                                            onClick={(): void => onSelect({ type: 'activity', hubName: hub.name, activityId: act.id })}
                                        >
                                            {activityEmoji(act.type)} {act.label}
                                        </div>
                                    ))}
                                </div>

                                {/* Devices header */}
                                <div
                                    style={{
                                        ...nodeStyle,
                                        fontWeight: 500,
                                        background: isSelected(selection, { type: 'deviceList', hubName: hub.name }) ? selectedBg : 'transparent',
                                    }}
                                    onClick={(): void => onSelect({ type: 'deviceList', hubName: hub.name })}
                                >
                                    Devices ({devices.length})
                                </div>

                                {/* Device children */}
                                <div style={{ marginLeft: 16 }}>
                                    {devices.map((dev) => (
                                        <div
                                            key={dev.id}
                                            style={{
                                                ...nodeStyle,
                                                background: isSelected(selection, { type: 'device', hubName: hub.name, deviceId: dev.id }) ? selectedBg : 'transparent',
                                            }}
                                            onClick={(): void => onSelect({ type: 'device', hubName: hub.name, deviceId: dev.id })}
                                        >
                                            {deviceEmoji(dev.type)} {dev.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
