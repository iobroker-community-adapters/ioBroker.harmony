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
import { I18n } from '@iobroker/adapter-react-v5';
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
                        {saving ? I18n.t('saving') : I18n.t('save')}
                    </Button>
                </Badge>

                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<UndoIcon />}
                    disabled={!canUndo}
                    onClick={onUndo}
                >
                    {I18n.t('undo')}
                </Button>

                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CancelIcon />}
                    disabled={!isDirty}
                    onClick={(): void => { setConfirmCancel(true); }}
                >
                    {I18n.t('cancel')}
                </Button>

                <Box sx={{ flex: 1 }} />

                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FileDownloadIcon />}
                    onClick={onExport}
                >
                    {I18n.t('export')}
                </Button>

                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FileUploadIcon />}
                    onClick={onImport}
                >
                    {I18n.t('import')}
                </Button>
            </Toolbar>

            <ConfirmDialog
                open={confirmSave}
                title={I18n.t('confirmSave')}
                message={I18n.t('confirmSaveMsg')}
                confirmLabel={I18n.t('save')}
                cancelLabel={I18n.t('cancel')}
                onConfirm={(): void => { void handleSave(); }}
                onCancel={(): void => { setConfirmSave(false); }}
            />

            <ConfirmDialog
                open={confirmCancel}
                title={I18n.t('confirmDiscard')}
                message={I18n.t('confirmDiscardMsg')}
                confirmLabel={I18n.t('delete')}
                cancelLabel={I18n.t('cancel')}
                onConfirm={handleCancel}
                onCancel={(): void => { setConfirmCancel(false); }}
            />
        </>
    );
}
