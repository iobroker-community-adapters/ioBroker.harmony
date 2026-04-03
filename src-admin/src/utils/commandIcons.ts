/**
 * Maps Harmony command names to control icon files.
 * The Harmony app uses: command name -> control_<name>.png
 */

const COMMAND_ICON_MAP: Record<string, string> = {
    'poweron': 'control_poweron.png',
    'poweroff': 'control_poweroff.png',
    'powertoggle': 'control_powertoggle.png',
    'volumeup': 'control_volumeup.png',
    'volumedown': 'control_volumedown.png',
    'mute': 'control_mute.png',
    'mutetoggle': 'control_mute.png',
    'channelup': 'control_channelup.png',
    'channeldown': 'control_channeldown.png',
    'directionup': 'control_directionup.png',
    'directiondown': 'control_directiondown.png',
    'directionleft': 'control_directionleft.png',
    'directionright': 'control_directionright.png',
    'select': 'control_button_on.png',
    'ok': 'control_button_on.png',
    'play': 'control_play.png',
    'pause': 'control_pause.png',
    'stop': 'control_stop.png',
    'fastforward': 'control_fastforward.png',
    'rewind': 'control_rewind.png',
    'skipforward': 'control_skipforward.png',
    'skipbackward': 'control_skipbackward.png',
    'record': 'control_record.png',
    'home': 'control_home.png',
    'back': 'control_back.png',
    'menu': 'control_topmenu.png',
    'guide': 'control_browse.png',
    'info': 'control_internet.png',
    'eject': 'control_eject.png',
    'sleep': 'control_sleep.png',
    'red': 'control_red.png',
    'green': 'control_green.png',
    'yellow': 'control_yellow.png',
    'blue': 'control_blue.png',
    'teletext': 'control_teletext.png',
    'prevchannel': 'control_prevchannel.png',
    'favorite': 'control_favorite.png',
    'search': 'control_search.png',
    'thumbsup': 'control_thumbsup.png',
    'thumbsdown': 'control_thumbsdown.png',
    'closedcaption': 'control_closedcaption.png',
    'piptoggle': 'control_piptoggle.png',
    'aspect': 'control_aspect.png',
    'live': 'control_live.png',
    'shuffle': 'control_shuffle.png',
    'repeat': 'control_repeat.png',
    'brightnessup': 'control_brightnessup.png',
    'brightnessdown': 'control_brightnessdown.png',
    'zoom': 'control_zoom.png',
    'zoomin': 'control_zoomin.png',
    'zoomout': 'control_zoomout.png',
    'pageup': 'control_pageup.png',
    'pagedown': 'control_pagedown.png',
    'audio': 'control_audio.png',
    'tivo': 'control_tivo.png',
    'ps': 'control_ps.png',
    'xboxguide': 'control_xboxguide.png',
    'frameadvance': 'control_frameadvance.png',
    'crossfade': 'control_crossfade.png',
    'nowplaying': 'control_nowplaying.png',
    'playlist': 'control_playlist.png',
    'schedule': 'control_schedule.png',
    'bookmark': 'control_bookmark.png',
    'browse': 'control_browse.png',
    'disc': 'control_disc.png',
    'internet': 'control_internet.png',
    'mediacenter': 'control_mediacenter.png',
    'mediaplayer': 'control_mediaplayer.png',
    'mymovies': 'control_mymovies.png',
    'mymusic': 'control_mymusic.png',
    'mypictures': 'control_mypictures.png',
    'myradio': 'control_myradio.png',
    'myvideos': 'control_myvideos.png',
    'tools': 'control_tools.png',
    'timer': 'control_timer.png',
    'size': 'control_size.png',
    'answer': 'control_answer.png',
    'hangup': 'control_hangup.png',
    'add': 'control_add.png',
    // Game buttons
    'gamea': 'control_gamea.png',
    'gameb': 'control_gameb.png',
    'gamex': 'control_gamex.png',
    'gamey': 'control_gamey.png',
    'a': 'control_a.png',
    'b': 'control_b.png',
    'c': 'control_c.png',
    'd': 'control_d.png',
    'circle': 'control_circle.png',
    'cross': 'control_cross.png',
    'square': 'control_square.png',
    'triangle': 'control_triangle.png',
    // Wii buttons
    'wii1': 'control_wii1.png',
    'wii2': 'control_wii2.png',
    'wiia': 'control_wiia.png',
    'wiib': 'control_wiib.png',
    'wiiminus': 'control_wiiminus.png',
    'wiiplus': 'control_wiiplus.png',
    'wiix': 'control_wiix.png',
    'wiiy': 'control_wiiy.png',
    // Number pad
    'number0': 'control_circle.png',
    'number1': 'control_disc1.png',
    'number2': 'control_disc2.png',
    'number3': 'control_disc3.png',
    'number4': 'control_disc4.png',
    'number5': 'control_disc5.png',
    'number6': 'control_disc6.png',
};

/**
 * Returns the icon path for a Harmony command name, or undefined if no icon matches.
 */
export function getCommandIconSrc(commandName: string): string | undefined {
    const name = commandName.toLowerCase();

    if (COMMAND_ICON_MAP[name]) {
        return `./custom/icons/${COMMAND_ICON_MAP[name]}`;
    }

    // Try partial matching - strip common suffixes/prefixes and retry
    for (const [key, file] of Object.entries(COMMAND_ICON_MAP)) {
        if (name.includes(key) && key.length >= 4) {
            return `./custom/icons/${file}`;
        }
    }

    return undefined;
}
