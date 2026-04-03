import React, { useState } from 'react';
import type { HarmonyDevice, HarmonyActivity } from '../../types/harmony';

interface DeviceEditorProps {
    device: HarmonyDevice;
    allActivities: HarmonyActivity[];
    onUpdate: (updated: HarmonyDevice) => void;
}

const TABS = ['Overview', 'Commands', 'Power Features', 'Used In'] as const;
type Tab = typeof TABS[number];

const tabStyle: React.CSSProperties = {
    padding: '8px 16px', border: 'none', borderBottom: '2px solid transparent',
    background: 'none', cursor: 'pointer', fontSize: 13, color: '#666',
};
const activeTabStyle: React.CSSProperties = {
    ...tabStyle, color: '#1976d2', borderBottomColor: '#1976d2', fontWeight: 600,
};
const labelStyle: React.CSSProperties = { fontSize: 12, color: '#888', marginBottom: 4 };
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13, boxSizing: 'border-box',
};
const readonlyStyle: React.CSSProperties = { ...inputStyle, background: '#f5f5f5', color: '#888' };
const cellStyle: React.CSSProperties = { padding: 8, borderBottom: '1px solid #f0f0f0' };
const thStyle: React.CSSProperties = { ...cellStyle, textAlign: 'left' as const, borderBottom: '2px solid #e0e0e0', fontSize: 12, textTransform: 'uppercase' as const, color: '#888' };

function transportLabel(transport: number): string {
    switch (transport) {
        case 1: return 'IR';
        case 32: return 'IP';
        case 33: return 'BT';
        default: return String(transport);
    }
}

export function DeviceEditor({ device, allActivities, onUpdate }: DeviceEditorProps): React.JSX.Element {
    const [activeTab, setActiveTab] = useState<Tab>('Overview');

    const handleField = <K extends keyof HarmonyDevice>(key: K, value: HarmonyDevice[K]): void => {
        onUpdate({ ...device, [key]: value });
    };

    const renderOverview = (): React.JSX.Element => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600 }}>
            <div>
                <div style={labelStyle}>Name</div>
                <input style={inputStyle} value={device.label} onChange={(e): void => handleField('label', e.target.value)} />
            </div>
            <div>
                <div style={labelStyle}>Manufacturer</div>
                <input style={inputStyle} value={device.manufacturer} onChange={(e): void => handleField('manufacturer', e.target.value)} />
            </div>
            <div>
                <div style={labelStyle}>Model</div>
                <input style={inputStyle} value={device.model} onChange={(e): void => handleField('model', e.target.value)} />
            </div>
            <div>
                <div style={labelStyle}>Icon</div>
                <input style={inputStyle} value={device.icon || ''} onChange={(e): void => handleField('icon', e.target.value)} />
            </div>
            <div>
                <div style={labelStyle}>Type</div>
                <input style={inputStyle} value={device.type} onChange={(e): void => handleField('type', e.target.value)} />
            </div>
            <div>
                <div style={labelStyle}>Transport</div>
                <input style={readonlyStyle} value={transportLabel(device.Transport)} readOnly />
            </div>
            <div>
                <div style={labelStyle}>ID</div>
                <input style={readonlyStyle} value={device.id} readOnly />
            </div>
            <div>
                <div style={labelStyle}>Display Name</div>
                <input style={inputStyle} value={device.deviceTypeDisplayName || ''} onChange={(e): void => handleField('deviceTypeDisplayName', e.target.value)} />
            </div>
        </div>
    );

    const renderCommands = (): React.JSX.Element => (
        <div>
            {(device.controlGroup || []).map((cg) => (
                <div key={cg.name} style={{ marginBottom: 16 }}>
                    <h5 style={{ margin: '0 0 8px', fontSize: 13, color: '#333' }}>{cg.name}</h5>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>Label</th>
                                <th style={thStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cg.function.map((fn) => (
                                <tr key={fn.name}>
                                    <td style={cellStyle}>{fn.name}</td>
                                    <td style={cellStyle}>{fn.label}</td>
                                    <td style={{ ...cellStyle, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fn.action}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
            {(!device.controlGroup || device.controlGroup.length === 0) && (
                <div style={{ color: '#888', fontSize: 13 }}>No commands defined for this device.</div>
            )}
        </div>
    );

    const renderPowerFeatures = (): React.JSX.Element => {
        const pf = device.powerFeatures;
        const renderActions = (actions: typeof pf.PowerOnActions, title: string): React.JSX.Element => (
            <div style={{ marginBottom: 16 }}>
                <h5 style={{ margin: '0 0 8px', fontSize: 13, color: '#333' }}>{title}</h5>
                {actions && actions.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Order</th>
                                <th style={thStyle}>Type</th>
                                <th style={thStyle}>Command / Duration</th>
                                <th style={thStyle}>Delay</th>
                            </tr>
                        </thead>
                        <tbody>
                            {actions.map((action, i) => (
                                <tr key={i}>
                                    <td style={cellStyle}>{action.Order}</td>
                                    <td style={cellStyle}>{action.__type}</td>
                                    <td style={cellStyle}>
                                        {action.__type === 'IRPressAction' ? action.IRCommandName || '-' : `${action.Duration ?? '-'} ms`}
                                    </td>
                                    <td style={cellStyle}>{action.Delay != null ? `${action.Delay} ms` : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ color: '#888', fontSize: 13 }}>No actions defined.</div>
                )}
            </div>
        );

        return (
            <div>
                {renderActions(pf?.PowerOnActions || [], 'Power On Actions')}
                {renderActions(pf?.PowerOffActions || [], 'Power Off Actions')}
            </div>
        );
    };

    const renderUsedIn = (): React.JSX.Element => {
        const usedActivities = allActivities.filter((act) =>
            act.fixit && Object.prototype.hasOwnProperty.call(act.fixit, device.id)
        );

        return (
            <div>
                {usedActivities.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Activity</th>
                                <th style={thStyle}>Role</th>
                                <th style={thStyle}>Power</th>
                                <th style={thStyle}>Input</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usedActivities.map((act) => {
                                const rule = act.fixit[device.id];
                                const role = act.roles?.[device.id] || '-';
                                return (
                                    <tr key={act.id}>
                                        <td style={cellStyle}>{act.label}</td>
                                        <td style={cellStyle}>{role}</td>
                                        <td style={cellStyle}>{rule?.Power || '-'}</td>
                                        <td style={cellStyle}>{rule?.Input || '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ color: '#888', fontSize: 13 }}>This device is not used in any activity.</div>
                )}
            </div>
        );
    };

    const renderTab = (): React.JSX.Element => {
        switch (activeTab) {
            case 'Overview': return renderOverview();
            case 'Commands': return renderCommands();
            case 'Power Features': return renderPowerFeatures();
            case 'Used In': return renderUsedIn();
        }
    };

    return (
        <div>
            <h4 style={{ margin: '0 0 12px' }}>{device.label}</h4>
            <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', marginBottom: 16 }}>
                {TABS.map((tab) => (
                    <button key={tab} style={activeTab === tab ? activeTabStyle : tabStyle} onClick={(): void => setActiveTab(tab)}>
                        {tab}
                    </button>
                ))}
            </div>
            {renderTab()}
        </div>
    );
}
