import React from 'react';
import { Alert } from '@mui/material';
import { I18n } from '@iobroker/adapter-react-v5';

interface UnsavedBannerProps {
    changeCount: number;
    visible: boolean;
}

export function UnsavedBanner({ changeCount, visible }: UnsavedBannerProps): React.JSX.Element | null {
    if (!visible || changeCount === 0) return null;

    return (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
            {changeCount} {I18n.t('unsavedChanges')}
        </Alert>
    );
}
