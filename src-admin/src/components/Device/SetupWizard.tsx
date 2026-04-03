import React, { useState, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stepper,
    Step,
    StepLabel,
    Typography,
    TextField,
    Box,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    LinearProgress,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import TvIcon from '@mui/icons-material/Tv';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MovieIcon from '@mui/icons-material/Movie';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import DevicesIcon from '@mui/icons-material/Devices';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
    { id: 'tv', label: 'TV', Icon: TvIcon },
    { id: 'avr', label: 'AV Receiver', Icon: VolumeUpIcon },
    { id: 'bluray', label: 'Blu-ray', Icon: MovieIcon },
    { id: 'console', label: 'Console', Icon: SportsEsportsIcon },
    { id: 'projector', label: 'Projector', Icon: DevicesIcon },
    { id: 'streaming', label: 'Streaming', Icon: DevicesIcon },
    { id: 'soundbar', label: 'Soundbar', Icon: MusicNoteIcon },
    { id: 'speaker', label: 'Speaker', Icon: MusicNoteIcon },
    { id: 'cable', label: 'Cable/Sat', Icon: DevicesIcon },
    { id: 'other', label: 'Other', Icon: DevicesIcon },
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

    return (
        <Dialog open onClose={onCancel} maxWidth="sm" fullWidth>
            <DialogTitle>Setup New Device</DialogTitle>
            <DialogContent>
                <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
                    {STEPS.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {/* Step 0: Device Type Selection */}
                {step === 0 && (
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            What type of device are you adding?
                        </Typography>
                        <Grid2 container spacing={1}>
                            {DEVICE_TYPES.map((dt) => {
                                const IconComp = dt.Icon;
                                return (
                                    <Grid2 key={dt.id} size={{ xs: 6, sm: 4 }}>
                                        <Card
                                            variant={selectedType === dt.id ? 'elevation' : 'outlined'}
                                            sx={{
                                                border: selectedType === dt.id ? 2 : 1,
                                                borderColor: selectedType === dt.id ? 'primary.main' : 'divider',
                                            }}
                                        >
                                            <CardActionArea onClick={(): void => handleSelectType(dt.id)}>
                                                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                                    <IconComp sx={{ fontSize: 32, mb: 0.5, color: 'primary.main' }} />
                                                    <Typography variant="body2" fontWeight={500}>{dt.label}</Typography>
                                                </CardContent>
                                            </CardActionArea>
                                        </Card>
                                    </Grid2>
                                );
                            })}
                        </Grid2>
                    </Box>
                )}

                {/* Step 1: IRDB Search */}
                {step === 1 && (
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Search the IR database for your device, or add codes manually.
                        </Typography>
                        <IRDBSearch onSelectCodeSet={handleSelectCodeSet} />
                        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            <IRCodeInput onAddCode={handleAddManualCode} />
                            {codes.length > 0 && (
                                <Box sx={{ mt: 1.5 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                                        Manual codes added: {codes.length}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                        {codes.map((c, i) => (
                                            <Chip key={i} label={c.name} size="small" />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}

                {/* Step 2: Test Codes */}
                {step === 2 && (
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Test the codes to make sure they work with your device.
                        </Typography>
                        <Card variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight={500} sx={{ mb: 1.5 }}>
                                {manufacturer} {model}
                            </Typography>
                            {codes.filter((c) => c.name.toLowerCase().includes('power')).slice(0, 1).map((c) => (
                                <Box key={c.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <IRTestButton hubName={hubName} deviceId="" command={c.name} label={`Test ${c.name}`} />
                                    <Typography variant="body2" color="text.secondary">
                                        Does the device respond?
                                    </Typography>
                                </Box>
                            ))}
                            {codes.filter((c) => c.name.toLowerCase().includes('power')).length === 0 && (
                                <Typography variant="body2" color="text.secondary">
                                    No Power command found. You can still proceed.
                                </Typography>
                            )}
                        </Card>
                    </Box>
                )}

                {/* Step 3: Name Device */}
                {step === 3 && (
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Give your device a friendly name.
                        </Typography>
                        <TextField
                            label="Device Name"
                            value={deviceName}
                            onChange={(e): void => setDeviceName(e.target.value)}
                            placeholder="e.g. Living Room TV"
                            fullWidth
                            autoFocus
                            sx={{ mb: 2 }}
                        />
                        <Card variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="body2"><strong>Type:</strong> {DEVICE_TYPES.find((d) => d.id === selectedType)?.label || selectedType}</Typography>
                            {manufacturer && <Typography variant="body2"><strong>Manufacturer:</strong> {manufacturer}</Typography>}
                            {model && <Typography variant="body2"><strong>Model:</strong> {model}</Typography>}
                            <Typography variant="body2"><strong>Commands:</strong> {codes.length}</Typography>
                        </Card>
                    </Box>
                )}

                {/* Step 4: Complete */}
                {step === 4 && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                        <Typography variant="h6" gutterBottom>Device Ready</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {deviceName || 'New Device'} has been configured with {codes.length} command{codes.length !== 1 ? 's' : ''}.
                        </Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>Cancel</Button>
                <Box sx={{ flex: 1 }} />
                {step > 0 && step < 4 && (
                    <Button onClick={(): void => setStep(step - 1)}>Back</Button>
                )}
                {step === 1 && codes.length > 0 && (
                    <Button variant="contained" onClick={(): void => setStep(2)}>Next</Button>
                )}
                {step === 2 && (
                    <Button variant="contained" onClick={(): void => setStep(3)}>Next</Button>
                )}
                {step === 3 && (
                    <Button variant="contained" onClick={(): void => setStep(4)}>Review</Button>
                )}
                {step === 4 && (
                    <Button variant="contained" onClick={handleFinish}>Complete Setup</Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
