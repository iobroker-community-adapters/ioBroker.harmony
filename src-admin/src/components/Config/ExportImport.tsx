import type { HarmonyConfig } from '../../types/harmony';

/** Download a hub configuration as JSON file. */
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

/** Open a file picker and import a JSON config. */
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
