import TvIcon from '@mui/icons-material/Tv';
import VideocamIcon from '@mui/icons-material/Videocam';
import SpeakerIcon from '@mui/icons-material/Speaker';
import FiberDvrIcon from '@mui/icons-material/FiberDvr';
import AlbumIcon from '@mui/icons-material/Album';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import ComputerIcon from '@mui/icons-material/Computer';
import HomeIcon from '@mui/icons-material/Home';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import SettingsInputHdmiIcon from '@mui/icons-material/SettingsInputHdmi';
import type { SvgIconComponent } from '@mui/icons-material';

export interface DeviceTypeInfo {
    label: string;
    icon: SvgIconComponent;
}

export const DEVICE_TYPE_MAP: Record<string, DeviceTypeInfo> = {
    'Television': { label: 'TV', icon: TvIcon },
    'Projector': { label: 'Projector', icon: VideocamIcon },
    'StereoReceiver': { label: 'AV Receiver', icon: SpeakerIcon },
    'AVReceiver': { label: 'AV Receiver', icon: SpeakerIcon },
    'DVR': { label: 'DVR / Recorder', icon: FiberDvrIcon },
    'DVD': { label: 'Blu-ray / DVD', icon: AlbumIcon },
    'GameConsole': { label: 'Game Console', icon: SportsEsportsIcon },
    'Computer': { label: 'Computer', icon: ComputerIcon },
    'HomeAppliance': { label: 'Home Appliance', icon: HomeIcon },
    'SatelliteBox': { label: 'Satellite / Cable', icon: SettingsInputHdmiIcon },
    'CableBox': { label: 'Cable Box', icon: SettingsInputHdmiIcon },
    'PVR': { label: 'PVR', icon: FiberDvrIcon },
};

export function getDeviceTypeLabel(type: string): string {
    return DEVICE_TYPE_MAP[type]?.label ?? type;
}

export function getDeviceTypeIcon(type: string): SvgIconComponent {
    // Try exact match first
    if (DEVICE_TYPE_MAP[type]) return DEVICE_TYPE_MAP[type].icon;
    // Fuzzy match
    const lower = type.toLowerCase();
    if (lower.includes('television') || lower.includes('tv')) return TvIcon;
    if (lower.includes('stereo') || lower.includes('receiver') || lower.includes('avr') || lower.includes('audio')) return SpeakerIcon;
    if (lower.includes('dvd') || lower.includes('blu') || lower.includes('disc')) return AlbumIcon;
    if (lower.includes('game') || lower.includes('console')) return SportsEsportsIcon;
    if (lower.includes('cable') || lower.includes('satellite') || lower.includes('pvr')) return SettingsInputHdmiIcon;
    if (lower.includes('projector')) return VideocamIcon;
    if (lower.includes('computer') || lower.includes('pc')) return ComputerIcon;
    return DevicesOtherIcon;
}
