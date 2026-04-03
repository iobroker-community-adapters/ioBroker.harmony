import React, { useState, useCallback } from 'react';

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

    const inputStyle: React.CSSProperties = {
        padding: '8px 10px', border: '1px solid #ccc', borderRadius: 4,
        fontSize: 13, boxSizing: 'border-box',
    };

    return (
        <div>
            <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Manual IR Code Entry</h4>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: '#666' }}>Command Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e): void => setName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g. Power, Volume Up"
                        style={{ ...inputStyle, width: 180 }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#666' }}>Pronto Hex Code</label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e): void => setCode(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="0000 006D 0022 ..."
                        style={{ ...inputStyle, width: '100%' }}
                    />
                </div>
                <button
                    onClick={handleAdd}
                    disabled={!name.trim() || !code.trim()}
                    style={{
                        padding: '8px 16px', border: 'none', borderRadius: 4,
                        background: name.trim() && code.trim() ? '#1976d2' : '#ccc',
                        color: '#fff', cursor: name.trim() && code.trim() ? 'pointer' : 'default',
                        fontSize: 13, whiteSpace: 'nowrap',
                    }}
                >
                    Add Code
                </button>
            </div>
        </div>
    );
}
