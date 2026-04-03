import React from 'react';
import {
    Box,
    Typography,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    Chip,
} from '@mui/material';
import type { HarmonyDevice } from '../../types/harmony';
import { getDeviceIconSrc } from '../../utils/deviceTypes';

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
            {devices.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No devices configured.
                </Typography>
            ) : (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell width={40} />
                                <TableCell>Name</TableCell>
                                <TableCell>Manufacturer</TableCell>
                                <TableCell>Model</TableCell>
                                <TableCell align="right">Commands</TableCell>
                                <TableCell>Transport</TableCell>
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
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: '50%',
                                                    bgcolor: 'grey.800',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    verticalAlign: 'middle',
                                                }}
                                            >
                                                <img
                                                    src={getDeviceIconSrc(dev.type)}
                                                    alt={dev.label}
                                                    style={{ width: 18, height: 18, objectFit: 'contain' }}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600} noWrap>
                                                {dev.label}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" noWrap>
                                                {dev.manufacturer}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" noWrap>
                                                {dev.model}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">{cmdCount}</TableCell>
                                        <TableCell>
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
                </TableContainer>
            )}
        </Box>
    );
}
