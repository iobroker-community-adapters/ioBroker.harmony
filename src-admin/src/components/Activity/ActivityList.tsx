import React from 'react';
import {
    Box,
    Typography,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
} from '@mui/material';
import type { HarmonyActivity } from '../../types/harmony';

interface ActivityListProps {
    activities: HarmonyActivity[];
    onSelectActivity: (id: string) => void;
}

export function ActivityList({ activities, onSelectActivity }: ActivityListProps): React.JSX.Element {
    const sorted = [...activities]
        .filter((a) => a.id !== '-1')
        .sort((a, b) => (a.activityOrder || 0) - (b.activityOrder || 0));

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Activities ({sorted.length})
            </Typography>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">Devices</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">Order</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sorted.map((act) => (
                        <TableRow
                            key={act.id}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={(): void => onSelectActivity(act.id)}
                        >
                            <TableCell sx={{ fontWeight: 500 }}>{act.label}</TableCell>
                            <TableCell>{act.activityTypeDisplayName || act.type}</TableCell>
                            <TableCell align="center">{Object.keys(act.fixit || {}).length}</TableCell>
                            <TableCell align="center">{act.activityOrder}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
}
