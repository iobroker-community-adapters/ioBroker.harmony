import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import type { HarmonyConfig } from '../../types/harmony';

interface HubOverviewProps {
    hubName: string;
    connected: boolean;
    config: HarmonyConfig | null;
    themeType: string;
}

export function HubOverview({ hubName, connected, config, themeType }: HubOverviewProps): React.JSX.Element {
    const activities = config?.activity?.filter((a) => a.id !== '-1') || [];
    const devices = config?.device || [];
    const totalCommands = devices.reduce(
        (sum, d) => sum + d.controlGroup.reduce((s, cg) => s + cg.function.length, 0),
        0,
    );

    const cards = [
        {
            label: 'Status',
            value: connected ? 'Connected' : 'Offline',
            icon: connected
                ? <CheckCircleIcon color="success" />
                : <ErrorIcon color="error" />,
        },
        { label: 'Activities', value: String(activities.length) },
        { label: 'Devices', value: String(devices.length) },
        { label: 'Commands', value: String(totalCommands) },
        { label: 'Locale', value: config?.global?.locale || '-' },
    ];

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                {hubName}
            </Typography>
            <Grid2 container spacing={2}>
                {cards.map((card) => (
                    <Grid2 key={card.label} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography
                                    variant="overline"
                                    color="text.secondary"
                                    sx={{ display: 'block', mb: 0.5 }}
                                >
                                    {card.label}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {card.icon}
                                    <Typography variant="h5" component="div" fontWeight={600}>
                                        {card.value}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid2>
                ))}
            </Grid2>
        </Box>
    );
}
