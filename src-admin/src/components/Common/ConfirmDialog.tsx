import React from 'react';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }: ConfirmDialogProps): React.JSX.Element | null {
    if (!open) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }} onClick={onCancel}>
            <div style={{
                background: '#fff', borderRadius: 8, padding: 24, minWidth: 320, maxWidth: 480,
                boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            }} onClick={(e): void => e.stopPropagation()}>
                <h4 style={{ margin: '0 0 12px', fontSize: 16 }}>{title}</h4>
                <p style={{ margin: '0 0 20px', color: '#555', fontSize: 14, lineHeight: 1.5 }}>{message}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4,
                            background: '#fff', cursor: 'pointer', fontSize: 13,
                        }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '8px 16px', border: 'none', borderRadius: 4,
                            background: '#1976d2', color: '#fff', cursor: 'pointer', fontSize: 13,
                        }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
