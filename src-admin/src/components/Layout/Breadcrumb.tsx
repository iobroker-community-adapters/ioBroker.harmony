import React from 'react';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import { I18n } from '@iobroker/adapter-react-v5';
import type { TreeSelection } from './TreeNav';

interface BreadcrumbProps {
    selection: TreeSelection | null;
    hubConfigs: Record<string, { activities: Record<string, string>; devices: Record<string, string> }>;
}

export function Breadcrumb({ selection, hubConfigs }: BreadcrumbProps): React.JSX.Element {
    if (!selection) {
        return (
            <Typography variant="caption" color="text.secondary" sx={{ py: 0.5 }}>
                No selection
            </Typography>
        );
    }

    const parts: string[] = [selection.hubName];
    const cfg = hubConfigs[selection.hubName];

    switch (selection.type) {
        case 'hub':
            break;
        case 'activityList':
            parts.push(I18n.t('activities'));
            break;
        case 'activity':
            parts.push(I18n.t('activities'));
            parts.push(cfg?.activities[selection.activityId] ?? selection.activityId);
            break;
        case 'deviceList':
            parts.push(I18n.t('devices'));
            break;
        case 'device':
            parts.push(I18n.t('devices'));
            parts.push(cfg?.devices[selection.deviceId] ?? selection.deviceId);
            break;
    }

    return (
        <Breadcrumbs separator=">" sx={{ py: 0.5, mb: 1 }}>
            {parts.map((part, i) =>
                i < parts.length - 1 ? (
                    <Link key={i} underline="hover" color="inherit" sx={{ fontSize: 13, cursor: 'default' }}>
                        {part}
                    </Link>
                ) : (
                    <Typography key={i} color="text.primary" sx={{ fontSize: 13 }}>
                        {part}
                    </Typography>
                )
            )}
        </Breadcrumbs>
    );
}
