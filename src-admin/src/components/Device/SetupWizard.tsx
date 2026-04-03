import React, { useState, useCallback } from 'react';
import { IRDBSearch } from '../IRDB/IRDBSearch';
import { IRTestButton } from '../IRDB/IRTestButton';
import { IRCodeInput } from '../IRDB/IRCodeInput';

interface DeviceDefinition {
    name: string;
    type: string;
    manufacturer: string;
    deviceType: string;
    model: string;
    codes: Array<{ name: string; functionCode: string }>;
}

interface SetupWizardProps {
    hubName: string;
    onComplete: (deviceDef: DeviceDefinition) => void;
    onCancel: () => void;
}

const DEVICE_TYPES = [
    { id: 'tv', label: 'TV', icon: '\uD83D\uDCFA' },
    { id: 'avr', label: 'AV Receiver', icon: '\uD83D\uDD0A' },
    { id: 'bluray', label: 'Blu-ray', icon: '\uD83D\uDCBF' },
    { id: 'console', label: 'Console', icon: '\uD83C\uDFAE' },
    { id: 'projector', label: 'Projector', icon: '\uD83D\uDCFD' },
    { id: 'streaming', label: 'Streaming', icon: '\uD83C\uDF10' },
    { id: 'soundbar', label: 'Soundbar', icon: '\uD83C\uDFB5' },
    { id: 'speaker', label: 'Speaker', icon: '\uD83C\uDFA7' },
    { id: 'cable', label: 'Cable/Sat', icon: '\uD83D\uDCE1' },
    { id: 'other', label: 'Other', icon: '\u2699' },
];

const STEPS = ['Device Type', 'Find Codes', 'Test', 'Name', 'Complete'];

export function SetupWizard({ hubName, onComplete, onCancel }: SetupWizardProps): React.JSX.Element {
    const [step, setStep] = useState(0);
    const [selectedType, setSelectedType] = useState('');
    const [manufacturer, setManufacturer] = useState('');
    const [deviceType, setDeviceType] = useState('');
    const [model, setModel] = useState('');
    const [codes, setCodes] = useState<Array<{ name: string; functionCode: string }>>([]);
    const [deviceName, setDeviceName] = useState('');

    const handleSelectType = useCallback((typeId: string) => {
        setSelectedType(typeId);
        setStep(1);
    }, []);

    const handleSelectCodeSet = useCallback((mfr: string, dt: string, mdl: string, fns: Array<{ name: string; functionCode: string }>) => {
        setManufacturer(mfr);
        setDeviceType(dt);
        setModel(mdl);
        setCodes(fns);
        setDeviceName(`${mfr} ${mdl}`);
        setStep(2);
    }, []);

    const handleAddManualCode = useCallback((name: string, code: string) => {
        setCodes((prev) => [...prev, { name, functionCode: code }]);
    }, []);

    const handleFinish = useCallback(() => {
        onComplete({
            name: deviceName.trim() || 'New Device',
            type: selectedType,
            manufacturer,
            deviceType,
            model,
            codes,
        });
    }, [onComplete, deviceName, selectedType, manufacturer, deviceType, model, codes]);

    const progressPct = ((step + 1) / STEPS.length) * 100;

    const overlayStyle: React.CSSProperties = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    };

    const dialogStyle: React.CSSProperties = {
        background: '#fff', borderRadius: 8, padding: 0, width: 560, maxWidth: '90vw',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
    };

    const headerStyle: React.CSSProperties = {
        padding: '16px 24px 0', borderBottom: 'none',
    };

    const bodyStyle: React.CSSProperties = {
        padding: '16px 24px', flex: 1, overflowY: 'auto',
    };

    const footerStyle: React.CSSProperties = {
        padding: '12px 24px', borderTop: '1px solid #e0e0e0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    };

    const btnPrimary: React.CSSProperties = {
        padding: '8px 20px', border: 'none', borderRadius: 4,
        background: '#1976d2', color: '#fff', cursor: 'pointer', fontSize: 13,
    };

    const btnSecondary: React.CSSProperties = {
        padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4,
        background: '#fff', cursor: 'pointer', fontSize: 13,
    };

    return (
        <div style={overlayStyle} onClick={onCancel}>
            <div style={dialogStyle} onClick={(e): void => e.stopPropagation()}>
                {/* Header with progress */}
                <div style={headerStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ margin: 0, fontSize: 16 }}>Setup New Device</h3>
                        <span style={{ fontSize: 12, color: '#888' }}>Step {step + 1} of {STEPS.length}</span>
                    </div>
                    <div style={{ height: 4, background: '#e0e0e0', borderRadius: 2, marginBottom: 0 }}>
                        <div style={{ height: '100%', background: '#1976d2', borderRadius: 2, width: `${progressPct}%`, transition: 'width 0.3s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0 0', fontSize: 11, color: '#aaa' }}>
                        {STEPS.map((s, i) => (
                            <span key={s} style={{ fontWeight: i === step ? 600 : 400, color: i === step ? '#1976d2' : i < step ? '#4caf50' : '#ccc' }}>{s}</span>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div style={bodyStyle}>
                    {/* Step 0: Device Type Selection */}
                    {step === 0 && (
                        <div>
                            <p style={{ margin: '0 0 16px', color: '#555', fontSize: 14 }}>What type of device are you adding?</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
                                {DEVICE_TYPES.map((dt) => (
                                    <div
                                        key={dt.id}
                                        onClick={(): void => handleSelectType(dt.id)}
                                        style={{
                                            border: selectedType === dt.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                            borderRadius: 8, padding: '16px 8px', textAlign: 'center', cursor: 'pointer',
                                            transition: 'border-color 0.2s',
                                        }}
                                        onMouseEnter={(e): void => { (e.currentTarget as HTMLElement).style.borderColor = '#90caf9'; }}
                                        onMouseLeave={(e): void => { (e.currentTarget as HTMLElement).style.borderColor = selectedType === dt.id ? '#1976d2' : '#e0e0e0'; }}
                                    >
                                        <div style={{ fontSize: 28, marginBottom: 6 }}>{dt.icon}</div>
                                        <div style={{ fontSize: 12, fontWeight: 500 }}>{dt.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 1: IRDB Search */}
                    {step === 1 && (
                        <div>
                            <p style={{ margin: '0 0 12px', color: '#555', fontSize: 14 }}>Search the IR database for your device, or add codes manually.</p>
                            <IRDBSearch onSelectCodeSet={handleSelectCodeSet} />
                            <div style={{ marginTop: 20, borderTop: '1px solid #e0e0e0', paddingTop: 16 }}>
                                <IRCodeInput onAddCode={handleAddManualCode} />
                                {codes.length > 0 && (
                                    <div style={{ marginTop: 12 }}>
                                        <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Manual codes added: {codes.length}</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                            {codes.map((c, i) => (
                                                <span key={i} style={{ background: '#e3f2fd', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{c.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Test Codes */}
                    {step === 2 && (
                        <div>
                            <p style={{ margin: '0 0 16px', color: '#555', fontSize: 14 }}>
                                Test the codes to make sure they work with your device. Point the hub at your {selectedType || 'device'} and press Test.
                            </p>
                            <div style={{ border: '1px solid #e0e0e0', borderRadius: 4, padding: 12 }}>
                                <div style={{ fontWeight: 500, marginBottom: 12, fontSize: 14 }}>
                                    {manufacturer} {model}
                                </div>
                                {codes.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {codes.filter((c) => c.name.toLowerCase().includes('power')).slice(0, 1).map((c) => (
                                            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <IRTestButton hubName={hubName} deviceId="" command={c.name} label={`Test ${c.name}`} />
                                                <span style={{ fontSize: 13, color: '#666' }}>Does the device respond?</span>
                                            </div>
                                        ))}
                                        {codes.filter((c) => c.name.toLowerCase().includes('power')).length === 0 && (
                                            <div style={{ color: '#888', fontSize: 13 }}>No Power command found in this code set. You can still proceed.</div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ color: '#888', fontSize: 13 }}>No codes selected. Go back to select or add codes.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Name Device */}
                    {step === 3 && (
                        <div>
                            <p style={{ margin: '0 0 16px', color: '#555', fontSize: 14 }}>Give your device a friendly name.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <label style={{ fontSize: 12, color: '#666' }}>Device Name</label>
                                <input
                                    type="text"
                                    value={deviceName}
                                    onChange={(e): void => setDeviceName(e.target.value)}
                                    placeholder="e.g. Living Room TV"
                                    style={{
                                        padding: '10px 12px', border: '1px solid #ccc', borderRadius: 4,
                                        fontSize: 14, boxSizing: 'border-box', width: '100%',
                                    }}
                                    autoFocus
                                />
                            </div>
                            <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4, fontSize: 13 }}>
                                <div><strong>Type:</strong> {DEVICE_TYPES.find((d) => d.id === selectedType)?.label || selectedType}</div>
                                {manufacturer && <div><strong>Manufacturer:</strong> {manufacturer}</div>}
                                {model && <div><strong>Model:</strong> {model}</div>}
                                <div><strong>Commands:</strong> {codes.length}</div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Complete */}
                    {step === 4 && (
                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>{'\u2713'}</div>
                            <h3 style={{ margin: '0 0 8px' }}>Device Ready</h3>
                            <p style={{ margin: 0, color: '#555', fontSize: 14 }}>
                                {deviceName || 'New Device'} has been configured with {codes.length} command{codes.length !== 1 ? 's' : ''}.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={footerStyle}>
                    <button onClick={onCancel} style={btnSecondary}>Cancel</button>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {step > 0 && step < 4 && (
                            <button onClick={(): void => setStep(step - 1)} style={btnSecondary}>Back</button>
                        )}
                        {step === 1 && codes.length > 0 && (
                            <button onClick={(): void => setStep(2)} style={btnPrimary}>Next</button>
                        )}
                        {step === 2 && (
                            <button onClick={(): void => setStep(3)} style={btnPrimary}>Next</button>
                        )}
                        {step === 3 && (
                            <button onClick={(): void => setStep(4)} style={btnPrimary}>Review</button>
                        )}
                        {step === 4 && (
                            <button onClick={handleFinish} style={btnPrimary}>Complete Setup</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
