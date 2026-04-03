import React, { useState, useCallback, useRef } from 'react';
import { useHarmonyApi } from '../../hooks/useHarmonyApi';

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

type SearchLevel = 'search' | 'manufacturer' | 'deviceType' | 'codeSet';

export function IRDBSearch({ onSelectCodeSet }: IRDBSearchProps): React.JSX.Element {
    const api = useHarmonyApi();
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
        const res = await api.searchIRDB(q);
        setLoading(false);
        if (res.success && res.data) {
            setManufacturers(res.data as IRDBManufacturer[]);
        } else {
            setError(res.error || 'Search failed');
        }
    }, [api]);

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
        const res = await api.getIRDBDeviceTypes(name);
        setLoading(false);
        if (res.success && res.data) {
            setDeviceTypes(res.data);
        } else {
            setError(res.error || 'Failed to load device types');
        }
    }, [api]);

    const selectDeviceType = useCallback(async (dt: string) => {
        setSelectedDeviceType(dt);
        setLevel('deviceType');
        setLoading(true);
        setError('');
        const res = await api.getIRDBCodeSets(selectedManufacturer, dt);
        setLoading(false);
        if (res.success && res.data) {
            setCodeSets(res.data as IRDBCodeSet[]);
        } else {
            setError(res.error || 'Failed to load code sets');
        }
    }, [api, selectedManufacturer]);

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

    const breadcrumbStyle: React.CSSProperties = {
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: '#666',
    };

    const backBtnStyle: React.CSSProperties = {
        background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer',
        fontSize: 13, padding: '2px 6px', borderRadius: 4,
    };

    const listItemStyle: React.CSSProperties = {
        padding: '10px 12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    };

    return (
        <div>
            {level !== 'search' && (
                <div style={breadcrumbStyle}>
                    <button style={backBtnStyle} onClick={goBack}>&larr; Back</button>
                    <span>{selectedManufacturer}</span>
                    {selectedDeviceType && <span> / {selectedDeviceType}</span>}
                </div>
            )}

            {error && (
                <div style={{ padding: 8, marginBottom: 12, background: '#fff3f3', color: '#c62828', borderRadius: 4, fontSize: 13 }}>
                    {error}
                </div>
            )}

            {level === 'search' && (
                <div>
                    <input
                        type="text"
                        value={query}
                        onChange={handleQueryChange}
                        placeholder="Search manufacturer (e.g. Samsung, Sony...)"
                        style={{
                            width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: 4,
                            fontSize: 14, boxSizing: 'border-box', marginBottom: 12,
                        }}
                    />
                    {loading && <div style={{ padding: 8, color: '#888', fontSize: 13 }}>Searching...</div>}
                    <div style={{ maxHeight: 300, overflowY: 'auto', border: manufacturers.length ? '1px solid #e0e0e0' : 'none', borderRadius: 4 }}>
                        {manufacturers.map((m) => (
                            <div
                                key={m.name}
                                style={listItemStyle}
                                onClick={(): void => { selectManufacturer(m.name); }}
                                onMouseEnter={(e): void => { (e.currentTarget as HTMLElement).style.background = '#f5f5f5'; }}
                                onMouseLeave={(e): void => { (e.currentTarget as HTMLElement).style.background = ''; }}
                            >
                                <span style={{ fontWeight: 500 }}>{m.name}</span>
                                <span style={{ color: '#999', fontSize: 12 }}>{m.deviceTypes.length} type{m.deviceTypes.length !== 1 ? 's' : ''}</span>
                            </div>
                        ))}
                    </div>
                    {!loading && query.length >= 2 && manufacturers.length === 0 && (
                        <div style={{ padding: 12, color: '#888', fontSize: 13, textAlign: 'center' }}>No manufacturers found</div>
                    )}
                </div>
            )}

            {level === 'manufacturer' && (
                <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Select device type</h4>
                    {loading && <div style={{ padding: 8, color: '#888', fontSize: 13 }}>Loading...</div>}
                    <div style={{ border: deviceTypes.length ? '1px solid #e0e0e0' : 'none', borderRadius: 4 }}>
                        {deviceTypes.map((dt) => (
                            <div
                                key={dt}
                                style={listItemStyle}
                                onClick={(): void => { selectDeviceType(dt); }}
                                onMouseEnter={(e): void => { (e.currentTarget as HTMLElement).style.background = '#f5f5f5'; }}
                                onMouseLeave={(e): void => { (e.currentTarget as HTMLElement).style.background = ''; }}
                            >
                                <span style={{ fontWeight: 500 }}>{dt}</span>
                            </div>
                        ))}
                    </div>
                    {!loading && deviceTypes.length === 0 && (
                        <div style={{ padding: 12, color: '#888', fontSize: 13, textAlign: 'center' }}>No device types available</div>
                    )}
                </div>
            )}

            {level === 'deviceType' && (
                <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Select code set</h4>
                    {loading && <div style={{ padding: 8, color: '#888', fontSize: 13 }}>Loading...</div>}
                    <div style={{ border: codeSets.length ? '1px solid #e0e0e0' : 'none', borderRadius: 4 }}>
                        {codeSets.map((cs, i) => (
                            <div
                                key={`${cs.model}-${i}`}
                                style={listItemStyle}
                                onClick={(): void => { selectCodeSet(cs); }}
                                onMouseEnter={(e): void => { (e.currentTarget as HTMLElement).style.background = '#f5f5f5'; }}
                                onMouseLeave={(e): void => { (e.currentTarget as HTMLElement).style.background = ''; }}
                            >
                                <div>
                                    <span style={{ fontWeight: 500 }}>{cs.model}</span>
                                    <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>{cs.protocol}</span>
                                </div>
                                <span style={{ color: '#999', fontSize: 12 }}>{cs.functions.length} commands</span>
                            </div>
                        ))}
                    </div>
                    {!loading && codeSets.length === 0 && (
                        <div style={{ padding: 12, color: '#888', fontSize: 13, textAlign: 'center' }}>
                            No code sets found for {selectedManufacturer} {selectedDeviceType}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
