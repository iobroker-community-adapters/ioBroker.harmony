import React from 'react';
import type { HarmonyActivity } from '../../types/harmony';

interface ActivityListProps {
    activities: HarmonyActivity[];
    onSelectActivity: (id: string) => void;
}

export function ActivityList({ activities, onSelectActivity }: ActivityListProps): React.JSX.Element {
    const sorted = [...activities].filter((a) => a.id !== '-1').sort((a, b) => (a.activityOrder || 0) - (b.activityOrder || 0));
    return (
        <div>
            <h4 style={{ margin: '0 0 16px' }}>Activities ({sorted.length})</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                        <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Type</th>
                        <th style={{ textAlign: 'center', padding: 8 }}>Devices</th>
                        <th style={{ textAlign: 'center', padding: 8 }}>Order</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((act) => (
                        <tr key={act.id} onClick={(): void => onSelectActivity(act.id)}
                            style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                            onMouseEnter={(e): void => { (e.currentTarget as HTMLElement).style.background = '#f5f5f5'; }}
                            onMouseLeave={(e): void => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                            <td style={{ padding: 8, fontWeight: 500 }}>{act.label}</td>
                            <td style={{ padding: 8, color: '#666' }}>{act.activityTypeDisplayName || act.type}</td>
                            <td style={{ padding: 8, textAlign: 'center' }}>{Object.keys(act.fixit || {}).length}</td>
                            <td style={{ padding: 8, textAlign: 'center' }}>{act.activityOrder}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
