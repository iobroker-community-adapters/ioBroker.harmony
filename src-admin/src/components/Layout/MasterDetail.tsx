import React, { useState, useRef, useCallback, useEffect } from 'react';

interface MasterDetailProps {
    master: React.ReactNode;
    detail: React.ReactNode;
    isMobile: boolean;
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

export function MasterDetail({ master, detail, isMobile }: MasterDetailProps): React.JSX.Element {
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

    if (isMobile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                {master}
                <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>{detail}</div>
            </div>
        );
    }

    return (
        <div ref={containerRef} style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <div style={{ width, minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH, overflow: 'auto', borderRight: '1px solid #e0e0e0' }}>
                {master}
            </div>
            <div
                onMouseDown={onMouseDown}
                style={{ width: 4, cursor: 'col-resize', background: 'transparent', transition: 'background 0.15s' }}
                onMouseEnter={(e): void => { (e.target as HTMLElement).style.background = '#1976d2'; }}
                onMouseLeave={(e): void => { if (!dragging.current) (e.target as HTMLElement).style.background = 'transparent'; }}
            />
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>{detail}</div>
        </div>
    );
}
