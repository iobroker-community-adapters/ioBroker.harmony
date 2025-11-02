export interface HarmonyAdapterConfig {
    subnet: string;
    discoverInterval: number | string;
    devices: { ip: string }[];
}
