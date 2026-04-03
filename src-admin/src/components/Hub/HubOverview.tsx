import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Table,
    TableBody,
    TableRow,
    TableCell,
    Button,
    Divider,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SyncIcon from '@mui/icons-material/Sync';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { I18n } from '@iobroker/adapter-react-v5';
import type { HarmonyConfig } from '../../types/harmony';

export interface HubOverviewProps {
    hubName: string;
    friendlyName: string;
    connected: boolean;
    config: HarmonyConfig | null;
    themeType: string;
    discoveryInfo?: Record<string, string>;
    stateDigest?: Record<string, unknown>;
    onExport?: () => void;
    onImport?: () => void;
    onSync?: () => void;
    onRefresh?: () => void;
}

const HUB_TYPE_LABELS: Record<string, string> = {
    '106': 'Harmony Home Hub',
    '97': 'Harmony Hub',
    '21': 'Harmony Elite',
    '19': 'Harmony Ultimate',
};

const ACTIVITY_STATUS_LABELS: Record<number, string> = {
    0: 'Stopped',
    1: 'Starting',
    2: 'Running',
    3: 'Stopping',
};

function kvRow(label: string, value: React.ReactNode): React.JSX.Element {
    return (
        <TableRow key={label} sx={{ '& td': { borderBottom: 'none', py: 0.5 } }}>
            <TableCell sx={{ fontWeight: 500, whiteSpace: 'nowrap', color: 'text.secondary', pl: 0, width: '40%' }}>
                {label}
            </TableCell>
            <TableCell sx={{ pr: 0 }}>{value}</TableCell>
        </TableRow>
    );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
    return (
        <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    {title}
                </Typography>
                <Table size="small">
                    <TableBody>{children}</TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function statusChip(connected: boolean): React.JSX.Element {
    return connected
        ? <Chip icon={<CheckCircleIcon />} label={I18n.t('connected')} color="success" size="small" variant="outlined" />
        : <Chip icon={<ErrorIcon />} label={I18n.t('offline')} color="error" size="small" variant="outlined" />;
}

export function HubOverview({
    hubName,
    friendlyName,
    connected,
    config,
    themeType: _themeType,
    discoveryInfo,
    stateDigest,
    onExport,
    onImport,
    onSync,
    onRefresh,
}: HubOverviewProps): React.JSX.Element {
    const activities = config?.activity?.filter((a) => a.id !== '-1') || [];
    const devices = config?.device || [];
    const totalCommands = devices.reduce(
        (sum, d) => sum + d.controlGroup.reduce((s, cg) => s + cg.function.length, 0),
        0,
    );

    // State digest values
    const runningActivityId = stateDigest?.activityId as string | undefined;
    const activityStatus = stateDigest?.activityStatus as number | undefined;
    const sleepTimerId = stateDigest?.sleepTimerId as number | undefined;
    const wifiStatus = stateDigest?.wifiStatus as number | undefined;

    // Find current activity name
    const currentActivityName = runningActivityId && runningActivityId !== '-1'
        ? config?.activity?.find((a) => a.id === runningActivityId)?.label || runningActivityId
        : I18n.t('idle');

    // Discovery info values
    const hubType = discoveryInfo?.hubType || '';
    const hubTypeLabel = HUB_TYPE_LABELS[hubType] || hubType || '-';
    const firmwareVersion = discoveryInfo?.firmwareVersion || discoveryInfo?.firmware || '-';
    const remoteId = discoveryInfo?.remoteId || '-';
    const uuid = discoveryInfo?.uuid || '-';
    const productId = discoveryInfo?.productId || '-';
    const ipAddress = discoveryInfo?.ip || '-';
    const xmppPort = discoveryInfo?.port || discoveryInfo?.xmppPort || '-';
    const email = discoveryInfo?.email || '-';
    const accountId = discoveryInfo?.accountId || '-';

    const protocolVersions: string[] = [];
    if (discoveryInfo?.protocolVersion) protocolVersions.push(`XMPP: ${discoveryInfo.protocolVersion}`);
    if (discoveryInfo?.httpProtocolVersion) protocolVersions.push(`HTTP: ${discoveryInfo.httpProtocolVersion}`);
    if (discoveryInfo?.rfProtocolVersion) protocolVersions.push(`RF: ${discoveryInfo.rfProtocolVersion}`);
    if (discoveryInfo?.wsProtocolVersion) protocolVersions.push(`WS: ${discoveryInfo.wsProtocolVersion}`);

    const configVersion = config?.global?.timeStampHash || '-';
    const locale = config?.global?.locale || '-';
    const sequences = config?.sequence?.length ?? 0;
    const setupComplete = config?.sla?.latestSLAAccepted;

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                {friendlyName || hubName}
            </Typography>
            <Grid2 container spacing={2}>
                {/* Section 1: Status */}
                <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                    <SectionCard title={I18n.t('status')}>
                        {kvRow(I18n.t('status'), statusChip(connected))}
                        {kvRow(I18n.t('currentActivity'), (
                            <Chip
                                label={currentActivityName}
                                size="small"
                                color={runningActivityId && runningActivityId !== '-1' ? 'primary' : 'default'}
                                variant="outlined"
                            />
                        ))}
                        {activityStatus !== undefined && kvRow(
                            I18n.t('status'),
                            ACTIVITY_STATUS_LABELS[activityStatus] || String(activityStatus),
                        )}
                        {kvRow(I18n.t('sleepTimer'), (
                            sleepTimerId && sleepTimerId > 0
                                ? <Chip label={`Active (${sleepTimerId})`} color="warning" size="small" variant="outlined" />
                                : <Typography variant="body2" component="span">{I18n.t('off') || 'Off'}</Typography>
                        ))}
                    </SectionCard>
                </Grid2>

                {/* Section 2: Hub Information */}
                <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                    <SectionCard title={I18n.t('hubInfo')}>
                        {kvRow(I18n.t('name'), friendlyName || hubName)}
                        {kvRow(I18n.t('hubType'), hubTypeLabel)}
                        {kvRow(I18n.t('firmware'), firmwareVersion)}
                        {kvRow(I18n.t('remoteId'), remoteId)}
                        {kvRow(I18n.t('uuid'), (
                            <Typography variant="body2" component="span" sx={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
                                {uuid}
                            </Typography>
                        ))}
                        {kvRow('Product ID', productId)}
                    </SectionCard>
                </Grid2>

                {/* Section 3: Network */}
                <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                    <SectionCard title={I18n.t('network')}>
                        {kvRow(I18n.t('ipAddress'), ipAddress)}
                        {kvRow('XMPP Port', xmppPort)}
                        {kvRow(I18n.t('wifiStatus'), (
                            wifiStatus !== undefined
                                ? <Chip
                                    label={wifiStatus === 1 ? I18n.t('connected') : I18n.t('offline')}
                                    color={wifiStatus === 1 ? 'success' : 'error'}
                                    size="small"
                                    variant="outlined"
                                />
                                : '-'
                        ))}
                        {kvRow(I18n.t('outOfHome'), (
                            discoveryInfo?.oohEnabled
                                ? discoveryInfo.oohEnabled === 'true' ? I18n.t('yes') : I18n.t('no')
                                : '-'
                        ))}
                        {protocolVersions.length > 0 && kvRow(I18n.t('protocols'), (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {protocolVersions.map((p) => (
                                    <Chip key={p} label={p} size="small" variant="outlined" />
                                ))}
                            </Box>
                        ))}
                    </SectionCard>
                </Grid2>

                {/* Section 4: Account */}
                <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                    <SectionCard title={I18n.t('account')}>
                        {kvRow(I18n.t('email'), email)}
                        {kvRow('Account ID', accountId)}
                        {kvRow(I18n.t('locale'), locale)}
                        {kvRow(I18n.t('timezone'), discoveryInfo?.timezone || '-')}
                    </SectionCard>
                </Grid2>

                {/* Section 5: Configuration Stats */}
                <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                    <SectionCard title={I18n.t('configStats')}>
                        {kvRow(I18n.t('configVersion'), (
                            <Typography variant="body2" component="span" sx={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                                {configVersion}
                            </Typography>
                        ))}
                        {kvRow(I18n.t('activities'), String(activities.length))}
                        {kvRow(I18n.t('devices'), String(devices.length))}
                        {kvRow(I18n.t('commands'), String(totalCommands))}
                        {kvRow(I18n.t('sequences'), String(sequences))}
                        {kvRow(I18n.t('setupComplete'), (
                            setupComplete !== undefined
                                ? <Chip
                                    label={setupComplete ? I18n.t('yes') : I18n.t('no')}
                                    color={setupComplete ? 'success' : 'warning'}
                                    size="small"
                                    variant="outlined"
                                />
                                : '-'
                        ))}
                    </SectionCard>
                </Grid2>

                {/* Section 6: Actions */}
                <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                {I18n.t('actions')}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                                {onExport && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<FileDownloadIcon />}
                                        onClick={onExport}
                                        fullWidth
                                    >
                                        {I18n.t('export')}
                                    </Button>
                                )}
                                {onImport && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<FileUploadIcon />}
                                        onClick={onImport}
                                        fullWidth
                                    >
                                        {I18n.t('import')}
                                    </Button>
                                )}
                                <Divider />
                                {onSync && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<SyncIcon />}
                                        onClick={onSync}
                                        fullWidth
                                    >
                                        {I18n.t('syncHub')}
                                    </Button>
                                )}
                                {onRefresh && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<RefreshIcon />}
                                        onClick={onRefresh}
                                        fullWidth
                                    >
                                        {I18n.t('refresh')}
                                    </Button>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid2>
            </Grid2>
        </Box>
    );
}
