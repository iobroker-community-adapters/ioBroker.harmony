import React, { useState } from 'react';
import type { HarmonyActivity, HarmonyDevice } from '../../types/harmony';

interface ActivityEditorProps {
    activity: HarmonyActivity;
    allDevices: HarmonyDevice[];
    onUpdate: (updated: HarmonyActivity) => void;
}

const TABS = ['Overview', 'Devices & Roles', 'Power Sequences', 'FixIt Rules', 'Commands'] as const;
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

export function ActivityEditor({ activity, allDevices, onUpdate }: ActivityEditorProps): React.JSX.Element {
    const [activeTab, setActiveTab] = useState<Tab>('Overview');

    const handleField = <K extends keyof HarmonyActivity>(key: K, value: HarmonyActivity[K]): void => {
        onUpdate({ ...activity, [key]: value });
    };

    const renderOverview = (): React.JSX.Element => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600 }}>
            <div>
                <div style={labelStyle}>Name</div>
                <input style={inputStyle} value={activity.label} onChange={(e): void => handleField('label', e.target.value)} />
            </div>
            <div>
                <div style={labelStyle}>Type</div>
                <select style={inputStyle} value={activity.type} onChange={(e): void => handleField('type', e.target.value)}>
                    {['VirtualTelevisionN', 'VirtualDvd', 'VirtualCdMulti', 'VirtualGameConsole', 'VirtualAux', 'VirtualOther'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>
            <div>
                <div style={labelStyle}>Order</div>
                <input style={inputStyle} type="number" value={activity.activityOrder ?? 0} onChange={(e): void => handleField('activityOrder', Number(e.target.value))} />
            </div>
            <div>
                <div style={labelStyle}>Icon</div>
                <input style={inputStyle} value={activity.icon || ''} onChange={(e): void => handleField('icon', e.target.value)} />
            </div>
            <div>
                <div style={labelStyle}>Display Name</div>
                <input style={inputStyle} value={activity.activityTypeDisplayName || ''} onChange={(e): void => handleField('activityTypeDisplayName', e.target.value)} />
            </div>
            <div>
                <div style={labelStyle}>ID</div>
                <input style={readonlyStyle} value={activity.id} readOnly />
            </div>
        </div>
    );

    const renderDevicesRoles = (): React.JSX.Element => {
        const fixitEntries = Object.entries(activity.fixit || {});
        return (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr>
                        <th style={thStyle}>Device</th>
                        <th style={thStyle}>Role</th>
                        <th style={thStyle}>Power</th>
                        <th style={thStyle}>Input</th>
                    </tr>
                </thead>
                <tbody>
                    {fixitEntries.map(([deviceId, rule]) => {
                        const device = allDevices.find((d) => d.id === deviceId);
                        const role = activity.roles?.[deviceId] || '-';
                        return (
                            <tr key={deviceId}>
                                <td style={cellStyle}>{device?.label || deviceId}</td>
                                <td style={cellStyle}>{role}</td>
                                <td style={cellStyle}>{rule.Power}</td>
                                <td style={cellStyle}>{rule.Input || '-'}</td>
                            </tr>
                        );
                    })}
                    {fixitEntries.length === 0 && (
                        <tr><td colSpan={4} style={{ ...cellStyle, color: '#888', textAlign: 'center' }}>No devices assigned</td></tr>
                    )}
                </tbody>
            </table>
        );
    };

    const renderPowerSequences = (): React.JSX.Element => (
        <div>
            <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>Power sequence data (visual editor coming soon)</div>
            <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 12 }}>
                {JSON.stringify(activity.fixit, null, 2)}
            </pre>
        </div>
    );

    const renderFixitRules = (): React.JSX.Element => {
        const fixitEntries = Object.entries(activity.fixit || {});
        return (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr>
                        <th style={thStyle}>Device</th>
                        <th style={thStyle}>Power</th>
                        <th style={thStyle}>Input</th>
                        <th style={thStyle}>Relative Power</th>
                        <th style={thStyle}>Manual Power</th>
                    </tr>
                </thead>
                <tbody>
                    {fixitEntries.map(([deviceId, rule]) => {
                        const device = allDevices.find((d) => d.id === deviceId);
                        return (
                            <tr key={deviceId}>
                                <td style={cellStyle}>{device?.label || deviceId}</td>
                                <td style={cellStyle}>{rule.Power}</td>
                                <td style={cellStyle}>{rule.Input || '-'}</td>
                                <td style={cellStyle}>{rule.isRelativePower ? 'Yes' : 'No'}</td>
                                <td style={cellStyle}>{rule.isManualPower ? 'Yes' : 'No'}</td>
                            </tr>
                        );
                    })}
                    {fixitEntries.length === 0 && (
                        <tr><td colSpan={5} style={{ ...cellStyle, color: '#888', textAlign: 'center' }}>No FixIt rules</td></tr>
                    )}
                </tbody>
            </table>
        );
    };

    const renderCommands = (): React.JSX.Element => (
        <div>
            {(activity.controlGroup || []).map((cg) => (
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
            {(!activity.controlGroup || activity.controlGroup.length === 0) && (
                <div style={{ color: '#888', fontSize: 13 }}>No commands defined for this activity.</div>
            )}
        </div>
    );

    const renderTab = (): React.JSX.Element => {
        switch (activeTab) {
            case 'Overview': return renderOverview();
            case 'Devices & Roles': return renderDevicesRoles();
            case 'Power Sequences': return renderPowerSequences();
            case 'FixIt Rules': return renderFixitRules();
            case 'Commands': return renderCommands();
        }
    };

    return (
        <div>
            <h4 style={{ margin: '0 0 12px' }}>{activity.label}</h4>
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
