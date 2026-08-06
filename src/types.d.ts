export interface HarmonyAdapterConfig {
    networkInterface: string;
    discoverInterval: number | string;
    devices: { ip: string; name?: string }[];
}
