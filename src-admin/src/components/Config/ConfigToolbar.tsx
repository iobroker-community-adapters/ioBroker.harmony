import React, { useState } from 'react';
import {
    Box,
    Button,
    Badge,
    Toolbar,
    Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import CancelIcon from '@mui/icons-material/Cancel';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
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

    return (
        <>
            <Toolbar
                variant="dense"
                disableGutters
                sx={{
                    gap: 1,
                    mb: 1.5,
                    borderBottom: 1,
                    borderColor: 'divider',
                    pb: 1,
                    flexWrap: 'wrap',
                }}
            >
                <Badge badgeContent={changeCount} color="warning" invisible={changeCount === 0}>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<SaveIcon />}
                        disabled={!isDirty || saving}
                        onClick={(): void => { setConfirmSave(true); }}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </Badge>

                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<UndoIcon />}
                    disabled={!canUndo}
                    onClick={onUndo}
                >
                    Undo
                </Button>

                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CancelIcon />}
                    disabled={!isDirty}
                    onClick={(): void => { setConfirmCancel(true); }}
                >
                    Cancel
                </Button>

                <Box sx={{ flex: 1 }} />

                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FileDownloadIcon />}
                    onClick={onExport}
                >
                    Export
                </Button>

                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FileUploadIcon />}
                    onClick={onImport}
                >
                    Import
                </Button>
            </Toolbar>

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
        </>
    );
}
