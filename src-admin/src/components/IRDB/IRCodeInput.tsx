import React, { useState, useCallback } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface IRCodeInputProps {
    onAddCode: (name: string, code: string) => void;
}

export function IRCodeInput({ onAddCode }: IRCodeInputProps): React.JSX.Element {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');

    const handleAdd = useCallback(() => {
        const trimmedName = name.trim();
        const trimmedCode = code.trim();
        if (!trimmedName || !trimmedCode) return;
        onAddCode(trimmedName, trimmedCode);
        setName('');
        setCode('');
    }, [name, code, onAddCode]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAdd();
    }, [handleAdd]);

    const canAdd = name.trim().length > 0 && code.trim().length > 0;

    return (
        <Box>
            <Typography variant="subtitle2" gutterBottom>
                Manual IR Code Entry
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <TextField
                    label="Command Name"
                    value={name}
                    onChange={(e): void => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. Power, Volume Up"
                    size="small"
                    sx={{ width: 180 }}
                />
                <TextField
                    label="Pronto Hex Code"
                    value={code}
                    onChange={(e): void => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="0000 006D 0022 ..."
                    size="small"
                    sx={{ flex: 1, minWidth: 200 }}
                />
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    disabled={!canAdd}
                    onClick={handleAdd}
                >
                    Add Code
                </Button>
            </Box>
        </Box>
    );
}
