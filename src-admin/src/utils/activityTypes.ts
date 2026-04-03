export interface ActivityTypeInfo {
    label: string;
    file: string;
}

export const ACTIVITY_TYPE_MAP: Record<string, ActivityTypeInfo> = {
    'VirtualTelevisionN': { label: 'Watch TV', file: 'activity_watch_tv.png' },
    'VirtualDvd': { label: 'Watch Movie', file: 'activity_watch_movie.png' },
    'VirtualCdMulti': { label: 'Listen to Music', file: 'activity_play_music.png' },
    'VirtualGameConsole': { label: 'Play Game', file: 'activity_play_game.png' },
    'VirtualAux': { label: 'AUX Input', file: 'activity_custom.png' },
    'VirtualOther': { label: 'Other', file: 'activity_custom.png' },
    'VirtualGeneric': { label: 'Generic', file: 'activity_custom.png' },
    'PowerOff': { label: 'Power Off', file: 'activity_powering_off.png' },
};

export function getActivityTypeLabel(type: string): string {
    return ACTIVITY_TYPE_MAP[type]?.label ?? type;
}

export function getActivityIconSrc(type: string): string {
    return `./icons/${ACTIVITY_TYPE_MAP[type]?.file ?? 'activity_custom.png'}`;
}

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
    return ROLE_LABEL_MAP[role] ?? role;
}
