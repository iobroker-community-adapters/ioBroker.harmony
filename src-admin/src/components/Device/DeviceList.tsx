import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActionArea,
    Chip,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import type { HarmonyDevice } from '../../types/harmony';
import { getDeviceTypeIcon, getDeviceTypeLabel } from '../../utils/deviceTypes';

interface DeviceListProps {
    devices: HarmonyDevice[];
    onSelectDevice: (id: string) => void;
}

function transportLabel(transport: number): string {
    switch (transport) {
        case 1: return 'IR';
        case 32: return 'IP';
        case 33: return 'BT';
        default: return String(transport);
    }
}

export function DeviceList({ devices, onSelectDevice }: DeviceListProps): React.JSX.Element {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Devices ({devices.length})
            </Typography>
            <Grid2 container spacing={2}>
                {devices.map((dev) => {
                    const DevTypeIcon = getDeviceTypeIcon(dev.type);
                    const cmdCount = dev.controlGroup.reduce((s, cg) => s + cg.function.length, 0);
                    return (
                        <Grid2 key={dev.id} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card
                                variant="outlined"
                                sx={{
                                    transition: 'all 0.15s ease',
                                    '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' },
                                }}
                            >
                                <CardActionArea onClick={(): void => onSelectDevice(dev.id)}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <DevTypeIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="subtitle1" fontWeight={600} noWrap>
                                                    {dev.label}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {dev.manufacturer} {dev.model}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                            <Chip
                                                label={getDeviceTypeLabel(dev.type)}
                                                size="small"
                                                variant="outlined"
                                            />
                                            <Chip
                                                label={`${cmdCount} cmd${cmdCount !== 1 ? 's' : ''}`}
                                                size="small"
                                                variant="outlined"
                                            />
                                            <Chip
                                                label={transportLabel(dev.Transport)}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Box>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid2>
                    );
                })}
            </Grid2>
            {devices.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No devices configured.
                </Typography>
            )}
        </Box>
    );
}
