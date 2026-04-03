import React from 'react';

interface UnsavedBannerProps {
    changeCount: number;
    visible: boolean;
}

export function UnsavedBanner({ changeCount, visible }: UnsavedBannerProps): React.JSX.Element | null {
    if (!visible || changeCount === 0) return null;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fff3e0', border: '1px solid #ffcc80', borderRadius: 4,
            padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#e65100',
        }}>
            <span style={{ fontSize: 16 }}>&#9888;</span>
            <span>{changeCount} unsaved change{changeCount !== 1 ? 's' : ''}</span>
        </div>
    );
}
