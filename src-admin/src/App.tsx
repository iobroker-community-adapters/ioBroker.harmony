import React, { useEffect, useState, useCallback } from 'react';
import type { HarmonyHubInfo } from './types/harmony';

declare function sendTo(namespace: string, command: string, payload: unknown,
    callback: (response: { success: boolean; data?: unknown; error?: string }) => void): void;

const NAMESPACE = 'harmony.0';

function App(): React.JSX.Element {
    const [hubs, setHubs] = useState<HarmonyHubInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadHubs = useCallback(() => {
        if (typeof sendTo !== 'function') {
            setLoading(false);
            setError('Not running in ioBroker admin context');
            return;
        }
        sendTo(NAMESPACE, 'getHubs', {}, (response) => {
            setLoading(false);
            if (response?.success && Array.isArray(response.data)) {
                setHubs(response.data as HarmonyHubInfo[]);
            } else {
                setError(response?.error || 'Failed to load hubs');
            }
        });
    }, []);

    useEffect(() => {
        const timer = setTimeout(loadHubs, 500);
        return (): void => { clearTimeout(timer); };
    }, [loadHubs]);

    if (loading) return <div style={{ padding: 32, textAlign: 'center' }}>Loading Harmony hubs...</div>;
    if (error) return <div style={{ padding: 32, color: '#c62828' }}>Error: {error}</div>;

    return (
        <div style={{ padding: 16 }}>
            <h4 style={{ margin: '0 0 16px' }}>Harmony Configuration</h4>
            {hubs.length === 0 ? <p>No hubs found.</p> : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {hubs.map((hub) => (
                        <li key={hub.name} style={{ padding: '12px 16px', margin: '8px 0', background: '#f5f5f5', borderRadius: 8, borderLeft: `4px solid ${hub.connected ? '#4caf50' : '#f44336'}` }}>
                            <strong>{hub.name}</strong>
                            <span style={{ marginLeft: 12, color: '#888' }}>
                                {hub.connected ? 'Connected' : 'Offline'}
                                {hub.activities > 0 && ` | ${hub.activities} activities`}
                                {hub.devices > 0 && ` | ${hub.devices} devices`}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default App;
