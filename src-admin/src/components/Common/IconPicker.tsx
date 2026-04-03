import React, { useState, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    Box,
    Typography,
    InputAdornment,
    IconButton,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import TvIcon from '@mui/icons-material/Tv';
import MovieIcon from '@mui/icons-material/Movie';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import CastIcon from '@mui/icons-material/Cast';
import SettingsIcon from '@mui/icons-material/Settings';
import CloudIcon from '@mui/icons-material/Cloud';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import HdIcon from '@mui/icons-material/Hd';
import SpeakerIcon from '@mui/icons-material/Speaker';
import AlbumIcon from '@mui/icons-material/Album';
import SettingsInputHdmiIcon from '@mui/icons-material/SettingsInputHdmi';
import ComputerIcon from '@mui/icons-material/Computer';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import LockIcon from '@mui/icons-material/Lock';
import PowerIcon from '@mui/icons-material/Power';
import SpeakerGroupIcon from '@mui/icons-material/SpeakerGroup';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import type { SvgIconComponent } from '@mui/icons-material';

interface IconOption {
    id: string;
    label: string;
    icon: SvgIconComponent;
}

const ACTIVITY_ICONS: IconOption[] = [
    { id: 'activity_watch_tv', label: 'Watch TV', icon: TvIcon },
    { id: 'activity_watch_movie', label: 'Movie', icon: MovieIcon },
    { id: 'activity_play_music', label: 'Music', icon: MusicNoteIcon },
    { id: 'activity_play_game', label: 'Gaming', icon: SportsEsportsIcon },
    { id: 'activity_netflix', label: 'Netflix', icon: OndemandVideoIcon },
    { id: 'activity_appletv', label: 'Apple TV', icon: LiveTvIcon },
    { id: 'activity_firetv', label: 'Fire TV', icon: WhatshotIcon },
    { id: 'activity_roku', label: 'Roku', icon: CastIcon },
    { id: 'activity_custom', label: 'Custom', icon: SettingsIcon },
    { id: 'activity_cloud', label: 'Streaming', icon: CloudIcon },
    { id: 'activity_sat', label: 'Satellite', icon: SatelliteAltIcon },
    { id: 'activity_hdtv', label: 'HDTV', icon: HdIcon },
];

const DEVICE_ICONS: IconOption[] = [
    { id: 'device_tv', label: 'Television', icon: TvIcon },
    { id: 'device_avr', label: 'AV Receiver', icon: SpeakerIcon },
    { id: 'device_dvd', label: 'Blu-ray/DVD', icon: AlbumIcon },
    { id: 'device_stb', label: 'Set-Top Box', icon: SettingsInputHdmiIcon },
    { id: 'device_game', label: 'Game Console', icon: SportsEsportsIcon },
    { id: 'device_pc', label: 'Computer', icon: ComputerIcon },
    { id: 'device_light', label: 'Light', icon: LightbulbIcon },
    { id: 'device_lock', label: 'Lock', icon: LockIcon },
    { id: 'device_plug', label: 'Plug/Switch', icon: PowerIcon },
    { id: 'device_sonos', label: 'Sonos', icon: SpeakerGroupIcon },
    { id: 'device_default', label: 'Other', icon: DevicesOtherIcon },
];

/** Exported for use outside the dialog, e.g. rendering the selected icon inline */
export function getIconById(iconId: string): IconOption | undefined {
    return [...ACTIVITY_ICONS, ...DEVICE_ICONS].find((o) => o.id === iconId);
}

interface IconPickerProps {
    open: boolean;
    value: string;
    type: 'activity' | 'device';
    onSelect: (iconId: string) => void;
    onClose: () => void;
}

export function IconPicker({ open, value, type, onSelect, onClose }: IconPickerProps): React.JSX.Element {
    const [search, setSearch] = useState('');
    const icons = type === 'activity' ? ACTIVITY_ICONS : DEVICE_ICONS;

    const filtered = useMemo(() => {
        if (!search.trim()) return icons;
        const q = search.toLowerCase();
        return icons.filter((o) => o.label.toLowerCase().includes(q) || o.id.toLowerCase().includes(q));
    }, [icons, search]);

    const handleSelect = (iconId: string): void => {
        onSelect(iconId);
        setSearch('');
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            slotProps={{ paper: { sx: { borderRadius: 3 } } }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Typography variant="h6" component="span">
                    Choose {type === 'activity' ? 'Activity' : 'Device'} Icon
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <TextField
                    placeholder="Search icons..."
                    value={search}
                    onChange={(e): void => setSearch(e.target.value)}
                    fullWidth
                    size="small"
                    autoFocus
                    sx={{ mb: 2, mt: 0.5 }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <Grid2 container spacing={1.5}>
                    {filtered.map((option) => {
                        const Icon = option.icon;
                        const isActive = value === option.id;
                        return (
                            <Grid2 key={option.id} size={{ xs: 4, sm: 3 }}>
                                <Box
                                    onClick={(): void => handleSelect(option.id)}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 1.5,
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        border: 2,
                                        borderColor: isActive ? 'primary.main' : 'divider',
                                        bgcolor: isActive ? 'primary.50' : 'background.paper',
                                        transition: 'all 0.15s ease',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: 'action.hover',
                                            transform: 'scale(1.04)',
                                        },
                                    }}
                                >
                                    <Icon
                                        sx={{
                                            fontSize: 32,
                                            mb: 0.5,
                                            color: isActive ? 'primary.main' : 'text.secondary',
                                        }}
                                    />
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            textAlign: 'center',
                                            fontWeight: isActive ? 600 : 400,
                                            color: isActive ? 'primary.main' : 'text.secondary',
                                        }}
                                    >
                                        {option.label}
                                    </Typography>
                                </Box>
                            </Grid2>
                        );
                    })}
                </Grid2>
                {filtered.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                        No icons match your search.
                    </Typography>
                )}
            </DialogContent>
        </Dialog>
    );
}
