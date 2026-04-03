export interface DeviceTypeInfo {
    label: string;
    file: string;
}

export const DEVICE_TYPE_MAP: Record<string, DeviceTypeInfo> = {
    'Television': { label: 'TV', file: 'device_tv_white.png' },
    'Projector': { label: 'Projector', file: 'device_tv_white.png' },
    'StereoReceiver': { label: 'AV Receiver', file: 'device_avr_white.png' },
    'AVReceiver': { label: 'AV Receiver', file: 'device_avr_white.png' },
    'DVR': { label: 'DVR / Recorder', file: 'device_stb_white.png' },
    'DVD': { label: 'Blu-ray / DVD', file: 'device_dvd_white.png' },
    'GameConsole': { label: 'Game Console', file: 'device_game_white.png' },
    'Computer': { label: 'Computer', file: 'device_pc_white.png' },
    'HomeAppliance': { label: 'Home Appliance', file: 'device_plug_white.png' },
    'SatelliteBox': { label: 'Satellite / Cable', file: 'device_stb_white.png' },
    'CableBox': { label: 'Cable Box', file: 'device_stb_white.png' },
    'PVR': { label: 'PVR', file: 'device_stb_white.png' },
};

export function getDeviceTypeLabel(type: string): string {
    return DEVICE_TYPE_MAP[type]?.label ?? type;
}

export function getDeviceIconSrc(type: string): string {
    // Try exact match first
    if (DEVICE_TYPE_MAP[type]) return `./icons/${DEVICE_TYPE_MAP[type].file}`;
    // Fuzzy match
    const lower = type.toLowerCase();
    if (lower.includes('television') || lower.includes('tv')) return './icons/device_tv_white.png';
    if (lower.includes('stereo') || lower.includes('receiver') || lower.includes('avr') || lower.includes('audio')) return './icons/device_avr_white.png';
    if (lower.includes('dvd') || lower.includes('blu') || lower.includes('disc')) return './icons/device_dvd_white.png';
    if (lower.includes('game') || lower.includes('console')) return './icons/device_game_white.png';
    if (lower.includes('cable') || lower.includes('satellite') || lower.includes('pvr')) return './icons/device_stb_white.png';
    if (lower.includes('projector')) return './icons/device_tv_white.png';
    if (lower.includes('computer') || lower.includes('pc')) return './icons/device_pc_white.png';
    return './icons/device_default_white.png';
}
