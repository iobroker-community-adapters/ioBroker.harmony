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
import type { HarmonyActivity } from '../../types/harmony';
import { getActivityTypeIcon, getActivityTypeLabel } from '../../utils/activityTypes';

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
            <Grid2 container spacing={2}>
                {sorted.map((act) => {
                    const ActIcon = getActivityTypeIcon(act.type);
                    const deviceCount = Object.keys(act.fixit || {}).length;
                    return (
                        <Grid2 key={act.id} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card
                                variant="outlined"
                                sx={{
                                    transition: 'all 0.15s ease',
                                    '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' },
                                }}
                            >
                                <CardActionArea onClick={(): void => onSelectActivity(act.id)}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <ActIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="subtitle1" fontWeight={600} noWrap>
                                                    {act.label}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {getActivityTypeLabel(act.type)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Chip
                                                label={`${deviceCount} device${deviceCount !== 1 ? 's' : ''}`}
                                                size="small"
                                                variant="outlined"
                                            />
                                            {act.activityOrder != null && (
                                                <Chip
                                                    label={`#${act.activityOrder}`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            )}
                                        </Box>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid2>
                    );
                })}
            </Grid2>
            {sorted.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No activities configured.
                </Typography>
            )}
        </Box>
    );
}
