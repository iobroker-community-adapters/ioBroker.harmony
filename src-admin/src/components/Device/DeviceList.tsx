import React from 'react';
import {
    Box,
    Typography,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Chip,
} from '@mui/material';
import type { HarmonyDevice } from '../../types/harmony';

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
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Manufacturer</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Model</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">Commands</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">Transport</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {devices.map((dev) => {
                        const cmdCount = dev.controlGroup.reduce((s, cg) => s + cg.function.length, 0);
                        return (
                            <TableRow
                                key={dev.id}
                                hover
                                sx={{ cursor: 'pointer' }}
                                onClick={(): void => onSelectDevice(dev.id)}
                            >
                                <TableCell sx={{ fontWeight: 500 }}>{dev.label}</TableCell>
                                <TableCell>{dev.manufacturer}</TableCell>
                                <TableCell>{dev.model}</TableCell>
                                <TableCell align="center">{cmdCount}</TableCell>
                                <TableCell align="center">
                                    <Chip
                                        label={transportLabel(dev.Transport)}
                                        size="small"
                                        variant="outlined"
                                    />
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </Box>
    );
}
