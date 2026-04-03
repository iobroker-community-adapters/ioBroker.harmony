import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, CircularProgress } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

type TestState = 'idle' | 'testing' | 'success' | 'fail';

interface IRTestButtonProps {
    hubName: string;
    deviceId: string;
    command: string;
    label: string;
}

declare function sendTo(
    namespace: string, command: string, payload: unknown,
    callback: (response: { success: boolean; data?: unknown; error?: string }) => void,
): void;

export function IRTestButton({ hubName, deviceId, command, label }: IRTestButtonProps): React.JSX.Element {
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
        const res = await new Promise<{ success: boolean }>((resolve) => {
            if (typeof sendTo !== 'function') {
                resolve({ success: false });
                return;
            }
            sendTo('harmony.0', 'testCommand', { hubName, deviceId, command, type: 'IRCommand' }, (r) => {
                resolve(r);
            });
        });
        const nextState: TestState = res.success ? 'success' : 'fail';
        setState(nextState);
        timerRef.current = setTimeout(() => setState('idle'), 2000);
    }, [hubName, deviceId, command, state]);

    const colorMap: Record<TestState, 'primary' | 'success' | 'error' | 'inherit'> = {
        idle: 'primary',
        testing: 'inherit',
        success: 'success',
        fail: 'error',
    };

    const iconMap: Record<TestState, React.JSX.Element> = {
        idle: <PlayArrowIcon fontSize="small" />,
        testing: <CircularProgress size={16} />,
        success: <CheckIcon fontSize="small" />,
        fail: <CloseIcon fontSize="small" />,
    };

    return (
        <Button
            variant="contained"
            size="small"
            color={colorMap[state]}
            disabled={state === 'testing'}
            onClick={handleClick}
            startIcon={iconMap[state]}
        >
            {label}
        </Button>
    );
}
