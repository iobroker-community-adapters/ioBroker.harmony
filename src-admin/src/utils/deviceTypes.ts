import { I18n } from '@iobroker/adapter-react-v5';

export interface DeviceTypeInfo {
    label: string;
    i18nKey: string;
    file: string;
}

export const DEVICE_TYPE_MAP: Record<string, DeviceTypeInfo> = {
    'Television': { label: 'TV', i18nKey: 'television', file: 'device_tv_white.png' },
    'Projector': { label: 'Projector', i18nKey: 'projector', file: 'device_tv_white.png' },
    'StereoReceiver': { label: 'AV Receiver', i18nKey: 'avReceiver', file: 'device_avr_white.png' },
    'AVReceiver': { label: 'AV Receiver', i18nKey: 'avReceiver', file: 'device_avr_white.png' },
    'DVR': { label: 'DVR / Recorder', i18nKey: 'setTopBox', file: 'device_stb_white.png' },
    'DVD': { label: 'Blu-ray / DVD', i18nKey: 'blurayDVD', file: 'device_dvd_white.png' },
    'GameConsole': { label: 'Game Console', i18nKey: 'gameConsole', file: 'device_game_white.png' },
    'Computer': { label: 'Computer', i18nKey: 'computer', file: 'device_pc_white.png' },
    'HomeAppliance': { label: 'Home Appliance', i18nKey: 'other', file: 'device_plug_white.png' },
    'SatelliteBox': { label: 'Satellite / Cable', i18nKey: 'satellite', file: 'device_stb_white.png' },
    'CableBox': { label: 'Cable Box', i18nKey: 'setTopBox', file: 'device_stb_white.png' },
    'PVR': { label: 'PVR', i18nKey: 'setTopBox', file: 'device_stb_white.png' },
};

export function getDeviceTypeLabel(type: string): string {
    const key = DEVICE_TYPE_MAP[type]?.i18nKey;
    return key ? I18n.t(key) : type;
}

export function getDeviceIconSrc(type: string): string {
    // Try exact match first
    if (DEVICE_TYPE_MAP[type]) return `./custom/icons/${DEVICE_TYPE_MAP[type].file}`;
    // Fuzzy match
    const lower = type.toLowerCase();
    if (lower.includes('television') || lower.includes('tv')) return './custom/icons/device_tv_white.png';
    if (lower.includes('stereo') || lower.includes('receiver') || lower.includes('avr') || lower.includes('audio')) return './custom/icons/device_avr_white.png';
    if (lower.includes('dvd') || lower.includes('blu') || lower.includes('disc')) return './custom/icons/device_dvd_white.png';
    if (lower.includes('game') || lower.includes('console')) return './custom/icons/device_game_white.png';
    if (lower.includes('cable') || lower.includes('satellite') || lower.includes('pvr')) return './custom/icons/device_stb_white.png';
    if (lower.includes('projector')) return './custom/icons/device_tv_white.png';
    if (lower.includes('computer') || lower.includes('pc')) return './custom/icons/device_pc_white.png';
    return './custom/icons/device_default_white.png';
}
