import React, { useState, useCallback, useRef } from 'react';
import {
    Box,
    TextField,
    Typography,
    List,
    ListItemButton,
    ListItemText,
    Button,
    CircularProgress,
    Alert,
    Breadcrumbs,
    Link,
    Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface IRDBManufacturer {
    name: string;
    deviceTypes: string[];
}

interface IRDBCodeSet {
    manufacturer: string;
    deviceType: string;
    model: string;
    protocol: string;
    functions: Array<{ name: string; functionCode: string }>;
}

interface IRDBSearchProps {
    onSelectCodeSet: (manufacturer: string, deviceType: string, model: string, codes: Array<{ name: string; functionCode: string }>) => void;
}

// Declare global sendTo for fallback (used when socket is not available)
declare function sendTo(
    namespace: string, command: string, payload: unknown,
    callback: (response: { success: boolean; data?: unknown; error?: string }) => void,
): void;

type SearchLevel = 'search' | 'manufacturer' | 'deviceType' | 'codeSet';

function apiCall<T>(command: string, payload: unknown = {}): Promise<{ success: boolean; data?: T; error?: string }> {
    return new Promise((resolve) => {
        if (typeof sendTo !== 'function') {
            resolve({ success: false, error: 'sendTo not available' });
            return;
        }
        sendTo('harmony.0', command, payload, (response) => {
            resolve(response as { success: boolean; data?: T; error?: string });
        });
    });
}

export function IRDBSearch({ onSelectCodeSet }: IRDBSearchProps): React.JSX.Element {
    const [level, setLevel] = useState<SearchLevel>('search');
    const [query, setQuery] = useState('');
    const [manufacturers, setManufacturers] = useState<IRDBManufacturer[]>([]);
    const [selectedManufacturer, setSelectedManufacturer] = useState('');
    const [deviceTypes, setDeviceTypes] = useState<string[]>([]);
    const [selectedDeviceType, setSelectedDeviceType] = useState('');
    const [codeSets, setCodeSets] = useState<IRDBCodeSet[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const doSearch = useCallback(async (q: string) => {
        if (q.length < 2) {
            setManufacturers([]);
            return;
        }
        setLoading(true);
        setError('');
        const res = await apiCall<IRDBManufacturer[]>('searchIRDB', { query: q });
        setLoading(false);
        if (res.success && res.data) {
            setManufacturers(res.data);
        } else {
            setError(res.error || 'Search failed');
        }
    }, []);

    const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(val), 300);
    }, [doSearch]);

    const selectManufacturer = useCallback(async (name: string) => {
        setSelectedManufacturer(name);
        setLevel('manufacturer');
        setLoading(true);
        setError('');
        const res = await apiCall<string[]>('getIRDBDeviceTypes', { manufacturer: name });
        setLoading(false);
        if (res.success && res.data) {
            setDeviceTypes(res.data);
        } else {
            setError(res.error || 'Failed to load device types');
        }
    }, []);

    const selectDeviceType = useCallback(async (dt: string) => {
        setSelectedDeviceType(dt);
        setLevel('deviceType');
        setLoading(true);
        setError('');
        const res = await apiCall<IRDBCodeSet[]>('getIRDBCodeSets', { manufacturer: selectedManufacturer, deviceType: dt });
        setLoading(false);
        if (res.success && res.data) {
            setCodeSets(res.data);
        } else {
            setError(res.error || 'Failed to load code sets');
        }
    }, [selectedManufacturer]);

    const selectCodeSet = useCallback((cs: IRDBCodeSet) => {
        setLevel('codeSet');
        onSelectCodeSet(cs.manufacturer, cs.deviceType, cs.model, cs.functions);
    }, [onSelectCodeSet]);

    const goBack = useCallback(() => {
        if (level === 'deviceType') {
            setLevel('manufacturer');
            setCodeSets([]);
            setSelectedDeviceType('');
        } else if (level === 'manufacturer') {
            setLevel('search');
            setDeviceTypes([]);
            setSelectedManufacturer('');
        }
    }, [level]);

    return (
        <Box>
            {level !== 'search' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Button size="small" startIcon={<ArrowBackIcon />} onClick={goBack}>
                        Back
                    </Button>
                    <Breadcrumbs separator="/">
                        <Typography variant="body2">{selectedManufacturer}</Typography>
                        {selectedDeviceType && <Typography variant="body2">{selectedDeviceType}</Typography>}
                    </Breadcrumbs>
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>
            )}

            {level === 'search' && (
                <Box>
                    <TextField
                        value={query}
                        onChange={handleQueryChange}
                        placeholder="Search manufacturer (e.g. Samsung, Sony...)"
                        fullWidth
                        size="small"
                        sx={{ mb: 1.5 }}
                    />
                    {loading && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                            <CircularProgress size={16} />
                            <Typography variant="body2" color="text.secondary">Searching...</Typography>
                        </Box>
                    )}
                    <List dense disablePadding>
                        {manufacturers.map((m) => (
                            <ListItemButton
                                key={m.name}
                                onClick={(): void => { selectManufacturer(m.name); }}
                                divider
                            >
                                <ListItemText
                                    primary={m.name}
                                    primaryTypographyProps={{ fontWeight: 500 }}
                                />
                                <Chip
                                    label={`${m.deviceTypes.length} type${m.deviceTypes.length !== 1 ? 's' : ''}`}
                                    size="small"
                                    variant="outlined"
                                />
                            </ListItemButton>
                        ))}
                    </List>
                    {!loading && query.length >= 2 && manufacturers.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 1.5 }}>
                            No manufacturers found
                        </Typography>
                    )}
                </Box>
            )}

            {level === 'manufacturer' && (
                <Box>
                    <Typography variant="subtitle2" gutterBottom>Select device type</Typography>
                    {loading && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                            <CircularProgress size={16} />
                            <Typography variant="body2" color="text.secondary">Loading...</Typography>
                        </Box>
                    )}
                    <List dense disablePadding>
                        {deviceTypes.map((dt) => (
                            <ListItemButton
                                key={dt}
                                onClick={(): void => { selectDeviceType(dt); }}
                                divider
                            >
                                <ListItemText primary={dt} primaryTypographyProps={{ fontWeight: 500 }} />
                            </ListItemButton>
                        ))}
                    </List>
                    {!loading && deviceTypes.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 1.5 }}>
                            No device types available
                        </Typography>
                    )}
                </Box>
            )}

            {level === 'deviceType' && (
                <Box>
                    <Typography variant="subtitle2" gutterBottom>Select code set</Typography>
                    {loading && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                            <CircularProgress size={16} />
                            <Typography variant="body2" color="text.secondary">Loading...</Typography>
                        </Box>
                    )}
                    <List dense disablePadding>
                        {codeSets.map((cs, i) => (
                            <ListItemButton
                                key={`${cs.model}-${i}`}
                                onClick={(): void => { selectCodeSet(cs); }}
                                divider
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" fontWeight={500}>{cs.model}</Typography>
                                            <Chip label={cs.protocol} size="small" variant="outlined" />
                                        </Box>
                                    }
                                />
                                <Chip
                                    label={`${cs.functions.length} cmds`}
                                    size="small"
                                    variant="outlined"
                                />
                            </ListItemButton>
                        ))}
                    </List>
                    {!loading && codeSets.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 1.5 }}>
                            No code sets found for {selectedManufacturer} {selectedDeviceType}
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    );
}
