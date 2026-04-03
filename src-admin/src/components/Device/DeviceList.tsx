import React from 'react';
import type { HarmonyDevice } from '../../types/harmony';

interface DeviceListProps {
    devices: HarmonyDevice[];
    onSelectDevice: (id: string) => void;
}

export function DeviceList({ devices, onSelectDevice }: DeviceListProps): React.JSX.Element {
    return (
        <div>
            <h4 style={{ margin: '0 0 16px' }}>Devices ({devices.length})</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                        <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Manufacturer</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Model</th>
                        <th style={{ textAlign: 'center', padding: 8 }}>Commands</th>
                        <th style={{ textAlign: 'center', padding: 8 }}>Transport</th>
                    </tr>
                </thead>
                <tbody>
                    {devices.map((dev) => {
                        const cmdCount = dev.controlGroup.reduce((s, cg) => s + cg.function.length, 0);
                        const transport = dev.Transport === 1 ? 'IR' : dev.Transport === 32 ? 'IP' : dev.Transport === 33 ? 'BT' : String(dev.Transport);
                        return (
                            <tr key={dev.id} onClick={(): void => onSelectDevice(dev.id)}
                                style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                                onMouseEnter={(e): void => { (e.currentTarget as HTMLElement).style.background = '#f5f5f5'; }}
                                onMouseLeave={(e): void => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                                <td style={{ padding: 8, fontWeight: 500 }}>{dev.label}</td>
                                <td style={{ padding: 8, color: '#666' }}>{dev.manufacturer}</td>
                                <td style={{ padding: 8, color: '#666' }}>{dev.model}</td>
                                <td style={{ padding: 8, textAlign: 'center' }}>{cmdCount}</td>
                                <td style={{ padding: 8, textAlign: 'center' }}>{transport}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
