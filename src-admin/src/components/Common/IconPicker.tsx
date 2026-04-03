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

interface IconOption {
    id: string;
    file: string;
    label: string;
}

const ACTIVITY_ICONS: IconOption[] = [
    { id: 'activity_watch_tv', file: 'activity_watch_tv.png', label: 'Watch TV' },
    { id: 'activity_watch_movie', file: 'activity_watch_movie.png', label: 'Watch Movie' },
    { id: 'activity_play_music', file: 'activity_play_music.png', label: 'Music' },
    { id: 'activity_play_game', file: 'activity_play_game.png', label: 'Gaming' },
    { id: 'activity_netflix', file: 'activity_netflix.png', label: 'Netflix' },
    { id: 'activity_appletv', file: 'activity_appletv.png', label: 'Apple TV' },
    { id: 'activity_firetv', file: 'activity_firetv.png', label: 'Fire TV' },
    { id: 'activity_roku', file: 'activity_roku.png', label: 'Roku' },
    { id: 'activity_amazon', file: 'activity_amazon.png', label: 'Amazon' },
    { id: 'activity_hdtv', file: 'activity_hdtv.png', label: 'HDTV' },
    { id: 'activity_sat', file: 'activity_sat.png', label: 'Satellite' },
    { id: 'activity_cloud', file: 'activity_cloud.png', label: 'Streaming' },
    { id: 'activity_custom', file: 'activity_custom.png', label: 'Custom' },
    { id: 'activity_mp3', file: 'activity_mp3.png', label: 'MP3' },
    { id: 'activity_music2', file: 'activity_music2.png', label: 'Music' },
    { id: 'activity_photos', file: 'activity_photos.png', label: 'Photos' },
    { id: 'activity_skype', file: 'activity_skype.png', label: 'Skype' },
    { id: 'activity_ps3', file: 'activity_ps3.png', label: 'PlayStation' },
    { id: 'activity_wii', file: 'activity_wii.png', label: 'Wii' },
    { id: 'activity_wii_u', file: 'activity_wii_u.png', label: 'Wii U' },
    { id: 'activity_shieldtv', file: 'activity_shieldtv.png', label: 'Shield TV' },
    { id: 'activity_google_tv', file: 'activity_google_tv.png', label: 'Google TV' },
    { id: 'activity_boxee', file: 'activity_boxee.png', label: 'Boxee' },
    { id: 'activity_pandora', file: 'activity_pandora.png', label: 'Pandora' },
    { id: 'activity_vudu', file: 'activity_vudu.png', label: 'Vudu' },
    { id: 'activity_movie3d', file: 'activity_movie3d.png', label: '3D Movie' },
    { id: 'activity_music3', file: 'activity_music3.png', label: 'Music' },
    { id: 'activity_powering_off', file: 'activity_powering_off.png', label: 'Power Off' },
];

const DEVICE_ICONS: IconOption[] = [
    { id: 'device_tv', file: 'device_tv_white.png', label: 'Television' },
    { id: 'device_avr', file: 'device_avr_white.png', label: 'AV Receiver' },
    { id: 'device_dvd', file: 'device_dvd_white.png', label: 'Blu-ray/DVD' },
    { id: 'device_stb', file: 'device_stb_white.png', label: 'Set-Top Box' },
    { id: 'device_game', file: 'device_game_white.png', label: 'Game Console' },
    { id: 'device_game_xboxone', file: 'device_game_xboxone_white.png', label: 'Xbox' },
    { id: 'device_sonyps4', file: 'device_sonyps4_white.png', label: 'PlayStation' },
    { id: 'device_pc', file: 'device_pc_white.png', label: 'Computer' },
    { id: 'device_sonos', file: 'device_sonos_white.png', label: 'Sonos' },
    { id: 'device_heos', file: 'device_heos_white.png', label: 'HEOS' },
    { id: 'device_roku', file: 'device_roku_white.png', label: 'Roku' },
    { id: 'device_amazon', file: 'device_amazon_white.png', label: 'Amazon' },
    { id: 'device_apple', file: 'device_apple_white.png', label: 'Apple TV' },
    { id: 'device_light', file: 'device_light_on.png', label: 'Light' },
    { id: 'device_lock', file: 'device_lock_white.png', label: 'Lock' },
    { id: 'device_plug', file: 'device_plug_white.png', label: 'Plug/Switch' },
    { id: 'device_sensor', file: 'device_sensor_white.png', label: 'Sensor' },
    { id: 'device_blind', file: 'device_blind_white.png', label: 'Blind/Cover' },
    { id: 'device_default', file: 'device_default_white.png', label: 'Other' },
];

const ALL_ICONS = [...ACTIVITY_ICONS, ...DEVICE_ICONS];

/** Returns the icon option for a given icon ID, or undefined if not found */
export function getIconById(iconId: string): IconOption | undefined {
    return ALL_ICONS.find((o) => o.id === iconId);
}

/** Returns the PNG path for a given icon ID */
export function getIconSrc(iconId: string): string | undefined {
    const opt = ALL_ICONS.find((o) => o.id === iconId);
    return opt ? `./icons/${opt.file}` : undefined;
}

/** Whether the icon is a device icon (white on transparent, needs dark bg) */
function isDeviceIcon(option: IconOption): boolean {
    return option.id.startsWith('device_');
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
                        const isActive = value === option.id;
                        const needsDarkBg = isDeviceIcon(option);
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
                                    {needsDarkBg ? (
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '50%',
                                                bgcolor: 'grey.800',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mb: 0.5,
                                            }}
                                        >
                                            <img
                                                src={`./icons/${option.file}`}
                                                alt={option.label}
                                                style={{ width: 24, height: 24, objectFit: 'contain' }}
                                            />
                                        </Box>
                                    ) : (
                                        <img
                                            src={`./icons/${option.file}`}
                                            alt={option.label}
                                            style={{ width: 32, height: 32, objectFit: 'contain', marginBottom: 4 }}
                                        />
                                    )}
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
