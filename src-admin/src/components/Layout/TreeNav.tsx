import React, { useState } from 'react';
import {
    Box,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RouterIcon from '@mui/icons-material/Router';
import TvIcon from '@mui/icons-material/Tv';
import MovieIcon from '@mui/icons-material/Movie';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import DevicesIcon from '@mui/icons-material/Devices';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import SettingsInputHdmiIcon from '@mui/icons-material/SettingsInputHdmi';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import type { HarmonyConfig } from '../../types/harmony';

export type TreeSelection =
    | { type: 'hub'; hubName: string }
    | { type: 'activityList'; hubName: string }
    | { type: 'activity'; hubName: string; activityId: string }
    | { type: 'deviceList'; hubName: string }
    | { type: 'device'; hubName: string; deviceId: string };

interface TreeNavProps {
    hubs: Array<{ name: string; connected: boolean; config: HarmonyConfig | null }>;
    selection: TreeSelection | null;
    onSelect: (sel: TreeSelection) => void;
}

function isSelected(selection: TreeSelection | null, candidate: TreeSelection): boolean {
    if (!selection) return false;
    if (selection.type !== candidate.type) return false;
    if (selection.hubName !== candidate.hubName) return false;
    if (selection.type === 'activity' && candidate.type === 'activity') {
        return selection.activityId === candidate.activityId;
    }
    if (selection.type === 'device' && candidate.type === 'device') {
        return selection.deviceId === candidate.deviceId;
    }
    return true;
}

function activityIcon(type: string): React.JSX.Element {
    const lower = type.toLowerCase();
    if (lower.includes('tv') || lower === 'vod') return <TvIcon fontSize="small" />;
    if (lower.includes('movie') || lower.includes('dvd') || lower.includes('blu')) return <MovieIcon fontSize="small" />;
    if (lower.includes('music') || lower.includes('audio')) return <MusicNoteIcon fontSize="small" />;
    if (lower.includes('game')) return <SportsEsportsIcon fontSize="small" />;
    return <PowerSettingsNewIcon fontSize="small" />;
}

function deviceIcon(type: string): React.JSX.Element {
    const lower = type.toLowerCase();
    if (lower.includes('television') || lower.includes('tv')) return <TvIcon fontSize="small" />;
    if (lower.includes('stereo') || lower.includes('receiver') || lower.includes('avr') || lower.includes('audio')) return <VolumeUpIcon fontSize="small" />;
    if (lower.includes('dvd') || lower.includes('blu') || lower.includes('disc')) return <MovieIcon fontSize="small" />;
    if (lower.includes('game') || lower.includes('console')) return <SportsEsportsIcon fontSize="small" />;
    if (lower.includes('cable') || lower.includes('satellite') || lower.includes('pvr')) return <SettingsInputHdmiIcon fontSize="small" />;
    return <DevicesIcon fontSize="small" />;
}

export function TreeNav({ hubs, selection, onSelect }: TreeNavProps): React.JSX.Element {
    const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        for (const h of hubs) init[h.name] = true;
        return init;
    });

    const toggle = (hubName: string): void => {
        setExpanded((prev) => ({ ...prev, [hubName]: !prev[hubName] }));
    };

    return (
        <Box sx={{ py: 1 }}>
            <List dense disablePadding>
                {hubs.map((hub) => {
                    const config = hub.config;
                    const activities = config ? config.activity.filter((a) => a.id !== '-1') : [];
                    const devices = config ? config.device : [];
                    const isExpanded = expanded[hub.name] ?? true;

                    return (
                        <React.Fragment key={hub.name}>
                            {/* Hub node */}
                            <ListItemButton
                                selected={isSelected(selection, { type: 'hub', hubName: hub.name })}
                                onClick={(): void => onSelect({ type: 'hub', hubName: hub.name })}
                                sx={{ pl: 1 }}
                            >
                                <ListItemIcon sx={{ minWidth: 32 }} onClick={(e): void => { e.stopPropagation(); toggle(hub.name); }}>
                                    {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" sx={{ transform: 'rotate(-90deg)' }} />}
                                </ListItemIcon>
                                <ListItemIcon sx={{ minWidth: 28 }}>
                                    {hub.connected
                                        ? <CheckCircleIcon fontSize="small" color="success" />
                                        : <ErrorIcon fontSize="small" color="error" />
                                    }
                                </ListItemIcon>
                                <ListItemText
                                    primary={hub.name}
                                    primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
                                />
                            </ListItemButton>

                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                {/* Activities header */}
                                <ListItemButton
                                    selected={isSelected(selection, { type: 'activityList', hubName: hub.name })}
                                    onClick={(): void => onSelect({ type: 'activityList', hubName: hub.name })}
                                    sx={{ pl: 4 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 28 }}>
                                        <RouterIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={`Activities (${activities.length})`}
                                        primaryTypographyProps={{ fontWeight: 500, fontSize: 13 }}
                                    />
                                </ListItemButton>

                                {/* Activity children */}
                                {activities.map((act) => (
                                    <ListItemButton
                                        key={act.id}
                                        selected={isSelected(selection, { type: 'activity', hubName: hub.name, activityId: act.id })}
                                        onClick={(): void => onSelect({ type: 'activity', hubName: hub.name, activityId: act.id })}
                                        sx={{ pl: 7 }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 28 }}>
                                            {activityIcon(act.type)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={act.label}
                                            primaryTypographyProps={{ fontSize: 13, noWrap: true }}
                                        />
                                    </ListItemButton>
                                ))}

                                {/* Devices header */}
                                <ListItemButton
                                    selected={isSelected(selection, { type: 'deviceList', hubName: hub.name })}
                                    onClick={(): void => onSelect({ type: 'deviceList', hubName: hub.name })}
                                    sx={{ pl: 4 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 28 }}>
                                        <DevicesIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={`Devices (${devices.length})`}
                                        primaryTypographyProps={{ fontWeight: 500, fontSize: 13 }}
                                    />
                                </ListItemButton>

                                {/* Device children */}
                                {devices.map((dev) => (
                                    <ListItemButton
                                        key={dev.id}
                                        selected={isSelected(selection, { type: 'device', hubName: hub.name, deviceId: dev.id })}
                                        onClick={(): void => onSelect({ type: 'device', hubName: hub.name, deviceId: dev.id })}
                                        sx={{ pl: 7 }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 28 }}>
                                            {deviceIcon(dev.type)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={dev.label}
                                            primaryTypographyProps={{ fontSize: 13, noWrap: true }}
                                        />
                                    </ListItemButton>
                                ))}
                            </Collapse>
                        </React.Fragment>
                    );
                })}
            </List>
        </Box>
    );
}
