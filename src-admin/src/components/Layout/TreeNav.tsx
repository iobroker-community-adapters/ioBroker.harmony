import React, { useState } from 'react';
import {
    Box,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    Typography,
    Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RouterIcon from '@mui/icons-material/Router';
import DevicesIcon from '@mui/icons-material/Devices';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { I18n } from '@iobroker/adapter-react-v5';
import type { HarmonyConfig } from '../../types/harmony';
import { getActivityIconSrc, getActivityTypeLabel } from '../../utils/activityTypes';
import { getDeviceIconSrc } from '../../utils/deviceTypes';
import { HarmonyIcon } from '../Common/HarmonyIcon';

export type TreeSelection =
    | { type: 'hub'; hubName: string }
    | { type: 'activityList'; hubName: string }
    | { type: 'activity'; hubName: string; activityId: string }
    | { type: 'deviceList'; hubName: string }
    | { type: 'device'; hubName: string; deviceId: string };

interface TreeNavProps {
    hubs: Array<{ name: string; friendlyName: string; connected: boolean; config: HarmonyConfig | null }>;
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
                    const activities = config
                        ? [...config.activity]
                            .filter((a) => a.id !== '-1')
                            .sort((a, b) => (a.activityOrder || 0) - (b.activityOrder || 0))
                        : [];
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
                                    primary={hub.friendlyName || hub.name}
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
                                        primary={`${I18n.t('activities')} (${activities.length})`}
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
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <HarmonyIcon src={getActivityIconSrc(act.type)} alt={act.label} size={28} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={act.label}
                                            secondary={getActivityTypeLabel(act.type)}
                                            primaryTypographyProps={{ fontSize: 13, noWrap: true }}
                                            secondaryTypographyProps={{ fontSize: 11 }}
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
                                        primary={`${I18n.t('devices')} (${devices.length})`}
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
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <HarmonyIcon src={getDeviceIconSrc(dev.type)} alt={dev.label} size={28} />
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
