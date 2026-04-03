import { I18n } from '@iobroker/adapter-react-v5';

export interface ActivityTypeInfo {
    label: string;
    i18nKey: string;
    file: string;
}

export const ACTIVITY_TYPE_MAP: Record<string, ActivityTypeInfo> = {
    'VirtualTelevisionN': { label: 'Watch TV', i18nKey: 'watchTV', file: 'activity_watch_tv.png' },
    'VirtualDvd': { label: 'Watch Movie', i18nKey: 'watchMovie', file: 'activity_watch_movie.png' },
    'VirtualCdMulti': { label: 'Listen to Music', i18nKey: 'listenMusic', file: 'activity_play_music.png' },
    'VirtualGameConsole': { label: 'Play Game', i18nKey: 'playGame', file: 'activity_play_game.png' },
    'VirtualAux': { label: 'AUX Input', i18nKey: 'generic', file: 'activity_custom.png' },
    'VirtualOther': { label: 'Other', i18nKey: 'other', file: 'activity_custom.png' },
    'VirtualGeneric': { label: 'Generic', i18nKey: 'generic', file: 'activity_custom.png' },
    'PowerOff': { label: 'Power Off', i18nKey: 'powerOff', file: 'activity_powering_off.png' },
};

export function getActivityTypeLabel(type: string): string {
    const key = ACTIVITY_TYPE_MAP[type]?.i18nKey;
    return key ? I18n.t(key) : type;
}

export function getActivityIconSrc(type: string): string {
    return `./custom/icons/${ACTIVITY_TYPE_MAP[type]?.file ?? 'activity_custom.png'}`;
}

/** i18n keys for activity device roles */
export const ROLE_I18N_MAP: Record<string, string> = {
    'VolumeActivityRole': 'volumeControl',
    'DisplayActivityRole': 'displayControl',
    'ChannelChangingActivityRole': 'channelControl',
    'PlayMovieActivityRole': 'moviePlayback',
    'PlayMusicActivityRole': 'musicPlayback',
    'NavigationActivityRole': 'navigationControl',
    'TextEntryActivityRole': 'textKeyboard',
    'GamePlayingActivityRole': 'gameControl',
};

/** Friendly role labels for activity device roles */
export const ROLE_LABEL_MAP: Record<string, string> = {
    'VolumeActivityRole': 'Volume Control',
    'DisplayActivityRole': 'Display',
    'ChannelChangingActivityRole': 'Channel Control',
    'PlayMovieActivityRole': 'Movie Playback',
    'PlayMusicActivityRole': 'Music Playback',
    'NavigationActivityRole': 'Navigation',
    'TextEntryActivityRole': 'Text / Keyboard',
    'GamePlayingActivityRole': 'Game Control',
};

export function getRoleLabel(role: string): string {
    const key = ROLE_I18N_MAP[role];
    return key ? I18n.t(key) : role;
}
