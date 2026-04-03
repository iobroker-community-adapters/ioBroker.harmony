import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useHarmonyApi } from '../../hooks/useHarmonyApi';

type TestState = 'idle' | 'testing' | 'success' | 'fail';

interface IRTestButtonProps {
    hubName: string;
    deviceId: string;
    command: string;
    label: string;
}

export function IRTestButton({ hubName, deviceId, command, label }: IRTestButtonProps): React.JSX.Element {
    const api = useHarmonyApi();
    const [state, setState] = useState<TestState>('idle');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return (): void => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const handleClick = useCallback(async () => {
        if (state === 'testing') return;
        setState('testing');
        const res = await api.testCommand(hubName, deviceId, command);
        const nextState: TestState = res.success ? 'success' : 'fail';
        setState(nextState);
        timerRef.current = setTimeout(() => setState('idle'), 2000);
    }, [api, hubName, deviceId, command, state]);

    const stateStyles: Record<TestState, React.CSSProperties> = {
        idle: { background: '#1976d2', color: '#fff', border: 'none' },
        testing: { background: '#90caf9', color: '#fff', border: 'none', cursor: 'wait' },
        success: { background: '#4caf50', color: '#fff', border: 'none' },
        fail: { background: '#ef5350', color: '#fff', border: 'none' },
    };

    const stateIcons: Record<TestState, string> = {
        idle: '\u25B6',
        testing: '\u23F3',
        success: '\u2713',
        fail: '\u2717',
    };

    return (
        <button
            onClick={handleClick}
            disabled={state === 'testing'}
            style={{
                ...stateStyles[state],
                padding: '6px 14px',
                borderRadius: 4,
                cursor: state === 'testing' ? 'wait' : 'pointer',
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
            }}
        >
            <span>{stateIcons[state]}</span>
            <span>{label}</span>
        </button>
    );
}
