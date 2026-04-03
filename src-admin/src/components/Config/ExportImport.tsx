import React, { useRef } from 'react';
import type { HarmonyConfig } from '../../types/harmony';

interface ExportImportProps {
    hubName: string;
    config: HarmonyConfig | null;
    onImport: (config: HarmonyConfig) => void;
}

export function ExportImport({ hubName, config, onImport }: ExportImportProps): React.JSX.Element {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = (): void => {
        if (!config) return;
        const date = new Date().toISOString().slice(0, 10);
        const filename = `harmony-${hubName}-${date}.json`;
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (): void => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (): void => {
            try {
                const parsed = JSON.parse(reader.result as string) as HarmonyConfig;
                if (!Array.isArray(parsed.activity) || !Array.isArray(parsed.device)) {
                    alert('Invalid config file: missing activity or device arrays.');
                    return;
                }
                onImport(parsed);
            } catch {
                alert('Failed to parse JSON file.');
            }
        };
        reader.readAsText(file);

        // Reset so the same file can be re-imported
        e.target.value = '';
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            {/* This component is used internally by ConfigToolbar; export/import are triggered via props */}
            <span data-export={handleExport} data-import={handleImport} style={{ display: 'none' }} />
        </>
    );
}

// Standalone helper functions for use in App.tsx
export function exportConfig(hubName: string, config: HarmonyConfig): void {
    const date = new Date().toISOString().slice(0, 10);
    const filename = `harmony-${hubName}-${date}.json`;
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function triggerImport(onImport: (config: HarmonyConfig) => void): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (): void => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (): void => {
            try {
                const parsed = JSON.parse(reader.result as string) as HarmonyConfig;
                if (!Array.isArray(parsed.activity) || !Array.isArray(parsed.device)) {
                    alert('Invalid config file: missing activity or device arrays.');
                    return;
                }
                onImport(parsed);
            } catch {
                alert('Failed to parse JSON file.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}
