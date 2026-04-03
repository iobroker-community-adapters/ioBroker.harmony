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
import { I18n } from '@iobroker/adapter-react-v5';
import type { HarmonyDevice } from '../../types/harmony';
import { getDeviceIconSrc } from '../../utils/deviceTypes';
import { HarmonyIcon } from '../Common/HarmonyIcon';

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
                {I18n.t('devices')} ({devices.length})
            </Typography>
            {devices.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    {I18n.t('noDevices')}
                </Typography>
            ) : (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell width={40} />
                                <TableCell>{I18n.t('name')}</TableCell>
                                <TableCell>{I18n.t('manufacturer')}</TableCell>
                                <TableCell>{I18n.t('model')}</TableCell>
                                <TableCell align="right">{I18n.t('commands')}</TableCell>
                                <TableCell>{I18n.t('transport')}</TableCell>
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
                                            <HarmonyIcon src={getDeviceIconSrc(dev.type)} alt={dev.label} size={28} />
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
