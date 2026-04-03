import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box, Divider } from '@mui/material';

interface MasterDetailProps {
    master: React.ReactNode;
    detail: React.ReactNode;
}

const STORAGE_KEY = 'harmony-splitter-width';
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 500;

function getStoredWidth(): number {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const val = parseInt(stored, 10);
            if (val >= MIN_WIDTH && val <= MAX_WIDTH) return val;
        }
    } catch { /* ignore */ }
    return DEFAULT_WIDTH;
}

export function MasterDetail({ master, detail }: MasterDetailProps): React.JSX.Element {
    const [width, setWidth] = useState(getStoredWidth);
    const dragging = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        dragging.current = true;
    }, []);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent): void => {
            if (!dragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, e.clientX - rect.left));
            setWidth(newWidth);
        };
        const onMouseUp = (): void => {
            if (dragging.current) {
                dragging.current = false;
                localStorage.setItem(STORAGE_KEY, String(width));
            }
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        return (): void => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [width]);

    return (
        <Box
            ref={containerRef}
            sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}
        >
            <Box
                sx={{
                    width,
                    minWidth: MIN_WIDTH,
                    maxWidth: MAX_WIDTH,
                    overflow: 'auto',
                    borderRight: 1,
                    borderColor: 'divider',
                }}
            >
                {master}
            </Box>
            <Divider
                orientation="vertical"
                flexItem
                onMouseDown={onMouseDown}
                sx={{
                    cursor: 'col-resize',
                    width: 4,
                    borderWidth: 0,
                    '&:hover': {
                        bgcolor: 'primary.main',
                    },
                }}
            />
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {detail}
            </Box>
        </Box>
    );
}
