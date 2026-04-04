/**
 * Frontend copy of shared TypeScript types for the Harmony Hub adapter.
 *
 * Field names match the live hub JSON data exactly.
 */

/** Summary information for a discovered Harmony Hub. */
export interface HarmonyHubInfo {
    name: string;
    friendlyName: string;
    ip: string;
    uuid: string;
    firmware: string;
    hubType: string;
    remoteId: string;
    connected: boolean;
    activities: number;
    devices: number;
}

/** Global hub settings. */
export interface HarmonyGlobal {
    timeStampHash: string;
    locale: string;
}

/** Top-level configuration object returned by the hub. */
export interface HarmonyConfig {
    dataConsent: boolean;
    sequence: HarmonySequence[];
    global: HarmonyGlobal;
    device: HarmonyDevice[];
    activity: HarmonyActivity[];
    sla: { latestSLAAccepted: boolean; latestSLAAcceptedDate: string };
    content: {
        contentUserHost: string;
        contentDeviceHost: string;
        contentServiceHost: string;
        contentImageHost: string;
        householdUserProfileUri: string;
    };
}

/** A custom button sequence (macro). */
export interface HarmonySequence {
    id: number;
    name: string;
    sequenceActions: SequenceAction[];
}

/** A single step within a custom sequence. */
export interface SequenceAction {
    type: string;
    deviceId: string;
    command: string;
    duration: number;
    delay: number;
}

/** An action that runs when an activity starts or stops. */
export interface EnterAction {
    type: string;
    deviceId: string;
    command: string;
    duration?: number;
    delay?: number;
}

/** A device registered on the hub. */
export interface HarmonyDevice {
    id: string;
    label: string;
    manufacturer: string;
    model: string;
    type: string;
    deviceTypeDisplayName: string;
    icon: string;
    Transport: number;
    ControlPort: number;
    Capabilities: number[];
    IsKeyboardAssociated: boolean;
    DongleRFID: number;
    isManualPower: string;
    deviceAddedDate: string;
    contentProfileKey: number;
    deviceProfileUri: string;
    suggestedDisplay: string;
    powerFeatures: PowerFeatures;
    controlGroup: ControlGroup[];
}

/** An activity defined on the hub (e.g. "Watch TV"). */
export interface HarmonyActivity {
    id: string;
    label: string;
    type: string;
    activityTypeDisplayName: string;
    activityOrder: number;
    icon: string;
    isAVActivity: boolean;
    isTuningDefault?: boolean;
    isMultiZone?: boolean;
    suggestedDisplay: string;
    baseImageUri?: string;
    VolumeActivityRole?: string;
    roles: Record<string, string>;
    controlGroup: ControlGroup[];
    fixit: Record<string, FixItRule>;
    rules: ActivityRule[];
    sequences: HarmonySequence[];
    enterActions: EnterAction[];
    zones?: unknown;
}

/** A rule within an activity (e.g., input switching, volume leveling). */
export interface ActivityRule {
    type: string;
    deviceId?: string;
    input?: string;
    [key: string]: unknown;
}

/** A named group of IR/BT commands (e.g. "Volume", "Channel"). */
export interface ControlGroup {
    name: string;
    function: CommandFunction[];
}

/** A single command within a control group. */
export interface CommandFunction {
    name: string;
    label: string;
    action: string;
}

/** Power-on and power-off action sequences for a device. */
export interface PowerFeatures {
    PowerOnActions: PowerAction[];
    PowerOffActions: PowerAction[];
}

/** An individual step in a power-on or power-off sequence. */
export interface PowerAction {
    __type: "IRPressAction" | "IRDelayAction";
    Order: number;
    IRCommandName?: string;
    Duration?: number | null;
    ActionId: number;
    Delay?: number;
}

/** A "fix-it" rule that corrects device state when starting an activity. */
export interface FixItRule {
    id: string;
    Power: string;
    Input?: string;
    isRelativePower?: boolean;
    isManualPower?: boolean;
}
