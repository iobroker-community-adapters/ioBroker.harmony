import React, { useState } from 'react';
import { ConfirmDialog } from '../Common/ConfirmDialog';

interface ConfigToolbarProps {
    isDirty: boolean;
    changeCount: number;
    canUndo: boolean;
    onSave: () => Promise<void>;
    onCancel: () => void;
    onUndo: () => void;
    onExport: () => void;
    onImport: () => void;
}

export function ConfigToolbar({ isDirty, changeCount, canUndo, onSave, onCancel, onUndo, onExport, onImport }: ConfigToolbarProps): React.JSX.Element {
    const [saving, setSaving] = useState(false);
    const [confirmSave, setConfirmSave] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);

    const handleSave = async (): Promise<void> => {
        setConfirmSave(false);
        setSaving(true);
        try {
            await onSave();
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = (): void => {
        setConfirmCancel(false);
        onCancel();
    };

    const btnBase: React.CSSProperties = {
        padding: '6px 14px', border: '1px solid #ccc', borderRadius: 4,
        background: '#fff', cursor: 'pointer', fontSize: 13, position: 'relative',
    };

    const btnPrimary: React.CSSProperties = {
        ...btnBase, background: '#1976d2', color: '#fff', border: 'none',
    };

    const disabledStyle: React.CSSProperties = { opacity: 0.5, cursor: 'default' };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #e0e0e0', marginBottom: 12, flexWrap: 'wrap' }}>
            <button
                style={{ ...btnPrimary, ...((!isDirty || saving) ? disabledStyle : {}) }}
                disabled={!isDirty || saving}
                onClick={(): void => { setConfirmSave(true); }}
            >
                {saving ? 'Saving...' : 'Save'}
            </button>

            <button
                style={{ ...btnBase, ...(!canUndo ? disabledStyle : {}) }}
                disabled={!canUndo}
                onClick={onUndo}
            >
                Undo
            </button>

            <button
                style={{ ...btnBase, ...(!isDirty ? disabledStyle : {}) }}
                disabled={!isDirty}
                onClick={(): void => { setConfirmCancel(true); }}
            >
                Cancel
            </button>

            <div style={{ flex: 1 }} />

            <button style={btnBase} onClick={onExport}>Export</button>
            <button style={btnBase} onClick={onImport}>Import</button>

            {changeCount > 0 && (
                <span style={{
                    background: '#ff9800', color: '#fff', borderRadius: 12,
                    padding: '2px 10px', fontSize: 12, fontWeight: 600,
                }}>
                    {changeCount}
                </span>
            )}

            <ConfirmDialog
                open={confirmSave}
                title="Save Configuration"
                message={`Apply ${changeCount} change(s) to the hub? This will overwrite the current hub configuration.`}
                confirmLabel="Save"
                cancelLabel="Cancel"
                onConfirm={(): void => { void handleSave(); }}
                onCancel={(): void => { setConfirmSave(false); }}
            />

            <ConfirmDialog
                open={confirmCancel}
                title="Discard Changes"
                message={`Discard ${changeCount} unsaved change(s)? This cannot be undone.`}
                confirmLabel="Discard"
                cancelLabel="Keep Editing"
                onConfirm={handleCancel}
                onCancel={(): void => { setConfirmCancel(false); }}
            />
        </div>
    );
}
