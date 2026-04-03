import TvIcon from '@mui/icons-material/Tv';
import MovieIcon from '@mui/icons-material/Movie';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import SettingsIcon from '@mui/icons-material/Settings';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import type { SvgIconComponent } from '@mui/icons-material';

export interface ActivityTypeInfo {
    label: string;
    icon: SvgIconComponent;
}

export const ACTIVITY_TYPE_MAP: Record<string, ActivityTypeInfo> = {
    'VirtualTelevisionN': { label: 'Watch TV', icon: TvIcon },
    'VirtualDvd': { label: 'Watch Movie', icon: MovieIcon },
    'VirtualCdMulti': { label: 'Listen to Music', icon: MusicNoteIcon },
    'VirtualGameConsole': { label: 'Play Game', icon: SportsEsportsIcon },
    'VirtualAux': { label: 'AUX Input', icon: SettingsIcon },
    'VirtualOther': { label: 'Other', icon: SettingsIcon },
    'VirtualGeneric': { label: 'Generic', icon: SettingsIcon },
    'PowerOff': { label: 'Power Off', icon: PowerSettingsNewIcon },
};

export function getActivityTypeLabel(type: string): string {
    return ACTIVITY_TYPE_MAP[type]?.label ?? type;
}

export function getActivityTypeIcon(type: string): SvgIconComponent {
    return ACTIVITY_TYPE_MAP[type]?.icon ?? SettingsIcon;
}

/** Friendly role labels for activity device roles */
export const ROLE_LABEL_MAP: Record<string, string> = {
    'VolumeActivityRole': 'Volume Control',
    'DisplayActivityRole': 'Display / Screen',
    'ChannelChangingActivityRole': 'Channel Control',
    'PlayMovieActivityRole': 'Movie Playback',
    'PlayMusicActivityRole': 'Music Playback',
    'NavigationActivityRole': 'Navigation / Menus',
    'TextEntryActivityRole': 'Text / Keyboard',
    'GamePlayingActivityRole': 'Game Control',
};

export function getRoleLabel(role: string): string {
    return ROLE_LABEL_MAP[role] ?? role;
}
