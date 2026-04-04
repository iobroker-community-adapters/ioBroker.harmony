import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActionArea,
    Chip,
    Button,
    IconButton,
    Tooltip,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import { I18n } from '@iobroker/adapter-react-v5';
import type { HarmonySequence } from '../../types/harmony';

interface SequenceListProps {
    sequences: HarmonySequence[];
    onSelectSequence: (id: number) => void;
    onAdd: () => void;
    onDelete: (id: number) => void;
}

export function SequenceList({ sequences, onSelectSequence, onAdd, onDelete }: SequenceListProps): React.JSX.Element {
    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">{I18n.t('sequences')}</Typography>
                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={onAdd}>
                    {I18n.t('add')}
                </Button>
            </Box>
            {sequences.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    {I18n.t('noSequences')}
                </Typography>
            ) : (
                <Grid2 container spacing={1.5}>
                    {sequences.map((seq) => (
                        <Grid2 key={seq.id} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card variant="outlined">
                                <CardActionArea onClick={(): void => onSelectSequence(seq.id)}>
                                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <PlaylistPlayIcon color="primary" />
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="subtitle2" fontWeight={600} noWrap>
                                                    {seq.name}
                                                </Typography>
                                                <Chip
                                                    label={`${(seq.sequenceActions || []).length} ${I18n.t('step')}`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Box>
                                            <Tooltip title={I18n.t('delete')}>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={(e): void => { e.stopPropagation(); onDelete(seq.id); }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid2>
                    ))}
                </Grid2>
            )}
        </Box>
    );
}
