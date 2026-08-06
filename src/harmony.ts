/**
 *
 *      ioBroker Logitech Harmony Adapter
 *
 *      MIT License
 *
 */
import { Adapter, type AdapterOptions } from '@iobroker/adapter-core';

import { Explorer, type HubData as HubDataConfig, ExplorerEvents } from './discover/lib/index.js';
import { fixId } from './lib/sanitize-id.js';
import { buildDiscoveryPlan, clampDiscoverInterval, type DiscoveryPlan } from './lib/discovery-config.js';
import { migrateLegacyConfig, type MigratableConfig } from './lib/migrate-config.js';
// @ts-expect-error -- no types available
import createSemaphore from 'semaphore';
// @ts-expect-error -- no types available
import HarmonyWS from 'harmonyhubws';
import type { HarmonyAdapterConfig } from './types';

interface HubData {
    client: {
        requestActivityChange: (activityId: string) => Promise<void>;
        requestConfig: () => void;
        requestState: () => void;
        requestKeyPress: (action: string, type: string | number, ms?: number) => void;
        close: () => void;
        status: number;
    } | null;
    connected: boolean;
    activities: { [activityId: string]: string };
    activitiesReverse: { [activityLabel: string]: string };
    devices: { [deviceId: string]: string };
    devicesReverse: { [deviceLabel: string]: string };
    blocked: boolean;
    timestamp: null;
    statesExist: boolean;
    ioChannels: { [id: string]: boolean };
    ioStates: { [id: string]: boolean };
    isSync: boolean;
    hasActivities: boolean;
    semaphore: any;
}

/** Wait before the first discovery restart after a socket error, then double up to the max. */
const DISCOVER_RESTART_MIN_MS = 30000;
const DISCOVER_RESTART_MAX_MS = 300000;

// Activity status state mappings
const ACTIVITY_STATUS_STATES: { [id: number]: string } = {
    0: 'stopped',
    1: 'starting',
    2: 'running',
    3: 'stopping',
};

export class HarmonyAdapter extends Adapter {
    declare config: HarmonyAdapterConfig;
    private hubs: { [id: string]: HubData } = {};
    private discover: null | Explorer = null;
    private discoveryPlan: DiscoveryPlan = { mode: 'broadcast', bindAddress: undefined, targets: ['255.255.255.255'] };
    private discoverInterval: number = 2000;
    private respondedHubIps: Set<string> = new Set();
    private discoverRestartTimer: ReturnType<HarmonyAdapter['setTimeout']> = undefined;
    private discoverRestartDelay: number = DISCOVER_RESTART_MIN_MS;
    private unloaded = false;

    public constructor(options: Partial<AdapterOptions> = {}) {
        super({
            ...options,
            name: 'harmony',
            ready: () => {
                this.main().catch(err => this.log.error(`[START] Startup failed: ${(err as Error)?.message ?? err}`));
            },
            stateChange: (id, state): void => this.onStateChange(id, state),
            unload: async (callback: () => void): Promise<void> => {
                try {
                    this.log.info('[END] Terminating');
                    this.unloaded = true;
                    if (this.discoverRestartTimer !== undefined) {
                        this.clearTimeout(this.discoverRestartTimer);
                        this.discoverRestartTimer = undefined;
                    }
                    this.discover?.stop();
                    this.discover = null;
                    for (const hub of Object.keys(this.hubs)) {
                        await this.clientStop(hub);
                    }
                    callback();
                } catch {
                    callback();
                }
            },
        });
    }

    onStateChange(id: string, state: ioBroker.State | null | undefined): void {
        if (!id || !state || state.ack) {
            return;
        }
        const hub = id.split('.')[2];
        if (!this.hubs[hub]) {
            return;
        }
        const semaphore = this.hubs[hub].semaphore;
        if (semaphore === undefined) {
            this.log.warn('state changed in offline hub');
            return;
        }
        if (semaphore.current > 0) {
            this.log.info(`hub busy, stateChange delayed: ${id} = ${state.val}`);
        }
        semaphore.take(async (): Promise<void> => {
            try {
                await this.setBlocked(hub, true);
                await this.processStateChange(hub, id, state);
                if (semaphore.current === 1) {
                    await this.setBlocked(hub, false);
                }
            } catch (err) {
                this.log.warn(`stateChange handler failed: ${(err as Error)?.message ?? err}`);
            } finally {
                semaphore.leave();
            }
        });
    }

    async processStateChange(hub: string, id: string, state: ioBroker.State): Promise<void> {
        const tmp = id.split('.');
        let channel = '';
        let name = '';
        if (tmp.length === 5) {
            name = tmp.pop();
            channel = tmp.pop();
        } else {
            this.log.warn('unknown state change');
            return;
        }
        switch (channel) {
            case 'activities':
                switch (name) {
                    case 'currentStatus':
                        await this.switchActivity(hub, undefined, 0);
                        break;
                    case 'currentActivity':
                        this.log.warn('change activities, not currentActivity');
                        break;
                    default:
                        name = name.replace(/-control$/, '');
                        await this.switchActivity(hub, name, state.val);
                        break;
                }
                break;
            default:
                this.log.debug(`sending command: ${channel}:${name}`);
                if (state.val) {
                    let ms = parseInt(state.val as string, 10);
                    if (isNaN(ms) || ms < 100) {
                        ms = 100;
                    }
                    await this.sendCommand(hub, id, ms);
                } else {
                    await this.setStateAsync(id, { val: 0, ack: true });
                }
                break;
        }
    }

    async sendCommand(hub: string, id: string, ms: number): Promise<void> {
        try {
            const obj = await this.getObjectAsync(id);
            if (!this.hubs[hub].client || this.hubs[hub].client.status !== 3) {
                this.log.warn('error sending command, client offline');
                await this.setStateAsync(id, { val: 0, ack: true });
                return;
            }
            this.log.debug(
                `sending command: ${typeof obj.common.name === 'object' ? JSON.stringify(obj.common.name) : obj.common.name}`,
            );

            if (ms <= 250) {
                this.hubs[hub].client.requestKeyPress(obj.native.action, 100);
                await this.setStateAsync(id, { val: 0, ack: true });
            } else {
                this.hubs[hub].client.requestKeyPress(obj.native.action, 'hold', ms);
                await new Promise<void>(resolve =>
                    setTimeout(() => {
                        void this.setState(id, { val: 0, ack: true });
                        resolve();
                    }, ms),
                );
            }
        } catch (err) {
            this.log.warn(`cannot send command, unknown state: ${err}`);
            await this.setStateAsync(id, { val: 0, ack: true });
        }
    }

    async switchActivity(hub: string, activityLabel: string | undefined, value: ioBroker.StateValue): Promise<void> {
        // TODO: requestActivityChange is no longer a fully working promise (it resolves after execution now instead
        //  of after hub has confirmed that the activity has been changed). So we should just block hub before
        //  calling switchActivity and unblock on receiving changed activity in listener maybe in setStatusFromActivityID
        if (!this.hubs[hub].client) {
            this.log.warn('[ACTIVITY] Error changing activity, client offline');
            return;
        }
        if (typeof value === 'boolean') {
            value = value ? 1 : 0;
        }
        // get current Activity
        value = parseInt(value as string, 10);
        if (isNaN(value)) {
            value = 1;
        }
        if (value === 0) {
            this.log.debug('[ACTIVITY] Turning activity off');
            await this.hubs[hub].client.requestActivityChange('-1');
        } else if (Object.prototype.hasOwnProperty.call(this.hubs[hub].activitiesReverse, activityLabel)) {
            this.log.debug(`[ACTIVITY] Switching activity to: ${activityLabel}`);
            await this.hubs[hub].client.requestActivityChange(this.hubs[hub].activitiesReverse[activityLabel]);
        } else {
            this.log.warn('[ACTIVITY] Activity does not exists');
        }
    }

    async main(): Promise<void> {
        await this.migrateDiscoveryConfig();
        this.discoveryPlan = buildDiscoveryPlan(this.config);
        this.discoverInterval = clampDiscoverInterval(this.config.discoverInterval);
        this.subscribeStates('*');
        this.discoverStart();
    }

    /**
     * Carry the removed `subnet` setting over into the current discovery config.
     *
     * Runs once: the migrated values are written back and `subnet` is deleted, so the next
     * start finds nothing to do. Persisting `native` makes js-controller restart the
     * instance, hence the values are also applied in memory — this run discovers correctly
     * either way, and a failed write degrades to "migrated for this session only" instead
     * of blocking startup.
     */
    private async migrateDiscoveryConfig(): Promise<void> {
        const legacy = this.config as unknown as MigratableConfig;
        const result = migrateLegacyConfig(legacy);
        if (!result.changed) {
            return;
        }

        this.log.info(
            `[MIGRATE] The "Discovery-Subnets" setting has been replaced by a network interface selector and a manual hub list. Converting "${String(legacy.subnet)}"`,
        );
        for (const note of result.notes) {
            this.log.info(`[MIGRATE] ${note}`);
        }

        this.config.networkInterface = result.networkInterface;
        this.config.devices = result.devices;
        delete legacy.subnet;

        try {
            await this.extendForeignObjectAsync(`system.adapter.${this.namespace}`, {
                native: {
                    // null deletes the key, so the migration cannot run a second time.
                    subnet: null,
                    networkInterface: result.networkInterface,
                    devices: result.devices,
                },
            });
            this.log.info('[MIGRATE] Discovery settings migrated, the instance restarts once to apply them');
        } catch (err) {
            this.log.warn(
                `[MIGRATE] Could not save the migrated discovery settings: ${(err as Error)?.message ?? err}. They are applied for this session only — please check the instance configuration.`,
            );
        }
    }

    discoverStart(): void {
        if (this.discover) {
            this.log.debug('[DISCOVER] Discover already started');
            return;
        }

        this.getPort(61991, port => {
            this.discover = new Explorer(port, {
                address: this.discoveryPlan.targets,
                bindAddress: this.discoveryPlan.bindAddress,
                port: 5224,
                interval: this.discoverInterval,
                logger: (text: string) => {
                    this.log.debug(text);
                },
            });
            this.discover.on(ExplorerEvents.ONLINE, (hub: HubDataConfig): void => {
                this.handleHubOnline(hub).catch(err =>
                    this.log.warn(`[DISCOVER] online handler failed: ${err?.message ?? err}`),
                );
            });

            this.discover.on('error', (err: Error): void => {
                this.log.warn(`[DISCOVER] Discover error: ${err.message}`);
                // A bind or listen failure takes the sockets down for good. Without a retry
                // the adapter would keep running but never discover anything again.
                this.scheduleDiscoverRestart();
            });

            this.discover.start();
            if (this.discoveryPlan.mode === 'unicast') {
                this.log.info(`[DISCOVER] Contacting hubs directly: ${this.discoveryPlan.targets.join(', ')}`);
                this.setTimeout(() => this.warnUnreachableManualHubs(), 30000);
            } else {
                const bindHint = this.discoveryPlan.bindAddress ? ` via ${this.discoveryPlan.bindAddress}` : '';
                this.log.info(
                    `[DISCOVER] Broadcasting for Harmony Hubs on ${this.discoveryPlan.targets.join(', ')}${bindHint}`,
                );
            }
        });
    }

    /** Tear the explorer down and start it again, with a doubling delay between attempts. */
    private scheduleDiscoverRestart(): void {
        if (this.unloaded || this.discoverRestartTimer !== undefined) {
            return;
        }

        const delay = this.discoverRestartDelay;
        this.log.info(`[DISCOVER] Restarting discovery in ${Math.round(delay / 1000)}s`);
        this.discoverRestartTimer = this.setTimeout(() => {
            this.discoverRestartTimer = undefined;
            this.discoverRestartDelay = Math.min(this.discoverRestartDelay * 2, DISCOVER_RESTART_MAX_MS);
            this.discoverStop();
            this.discoverStart();
        }, delay);
    }

    private discoverStop(): void {
        try {
            this.discover?.stop();
        } catch (err) {
            this.log.debug(`[DISCOVER] Stopping the explorer failed: ${(err as Error)?.message ?? err}`);
        }
        this.discover = null;
    }

    private async handleHubOnline(hub: HubDataConfig): Promise<void> {
        if (hub.friendlyName === undefined) {
            return;
        }
        // Discovery works, so a later failure starts over at the short delay.
        this.discoverRestartDelay = DISCOVER_RESTART_MIN_MS;
        if (hub.ip) {
            this.respondedHubIps.add(hub.ip);
        }
        const hubName = fixId(hub.friendlyName);
        if (this.hubs[hubName]) {
            return;
        }
        this.log.info(`[DISCOVER] Discovered ${hub.friendlyName} (${hub.ip}) and will try to connect`);
        await this.initHub(hubName);
        this.log.info(`[CONNECT] Connecting to ${hub.friendlyName} (${hub.ip})`);
        this.connect(hubName, hub);
    }

    private warnUnreachableManualHubs(): void {
        // The discovery plan holds exactly the IPs that were contacted: trimmed and
        // validated by buildDiscoveryPlan. Compare against those so a stray blank or a
        // typo'd address gets an accurate message instead of a false "no hub responded".
        const contacted = new Set(this.discoveryPlan.targets);
        for (const dev of this.config.devices ?? []) {
            const ip = typeof dev?.ip === 'string' ? dev.ip.trim() : '';
            if (!ip) {
                continue;
            }
            if (!contacted.has(ip)) {
                this.log.warn(
                    `[DISCOVER] Configured hub address "${dev.ip}" is not a valid IPv4 address and was skipped`,
                );
                continue;
            }
            if (this.respondedHubIps.has(ip)) {
                continue;
            }
            const label = dev.name && dev.name.length > 0 ? `${dev.name} (${ip})` : ip;
            this.log.warn(
                `[DISCOVER] No Harmony Hub responded at ${label} within 30s — check the IP and that the hub is powered on`,
            );
        }
    }

    async initHub(hub: string): Promise<void> {
        this.hubs[hub] = {
            client: null,
            connected: false,
            activities: {},
            activitiesReverse: {},
            devices: {},
            devicesReverse: {},
            blocked: true,
            timestamp: null,
            statesExist: false,
            ioChannels: {},
            ioStates: {},
            isSync: false,
            semaphore: createSemaphore(1),
            hasActivities: false,
        };

        try {
            const state = await this.getStateAsync(`${hub}.hubConnected`);
            if (!state) {
                this.log.debug('hub not initialized');
                return;
            }
            const channels = await this.getChannelsOfAsync(hub);
            for (let i = 0; i < channels.length; i++) {
                const channel = channels[i];
                if (channel.common.name === 'activities') {
                    this.hubs[hub].statesExist = true;
                    await this.setBlocked(hub, true);
                    await this.setConnected(hub, false);
                    this.hubs[hub].hasActivities = true;
                    this.log.debug('hub initialized');
                    continue;
                }

                this.hubs[hub].ioChannels[channel.common.name as string] = true;
            }
            const states = await this.getStatesAsync(`${hub}.activities.*`);
            if (states && Object.keys(states).length > 0) {
                // Cut at the channel instead of splitting on every dot: states created before
                // dots were sanitised are named e.g. "Movie_v1.2", and popping the last
                // segment would register them as "2" — the old object then survives every
                // clean-up pass while a bogus id gets deleted instead.
                const prefix = `${hub}.activities.`;
                for (const stateId of Object.keys(states)) {
                    const at = stateId.lastIndexOf(prefix);
                    if (at < 0) {
                        continue;
                    }
                    const name = stateId.slice(at + prefix.length);
                    if (name && name !== 'currentStatus' && name !== 'currentActivity') {
                        this.hubs[hub].ioStates[name] = true;
                    }
                }
            } else {
                this.log.debug('no activities found on hub');
            }
        } catch (err) {
            this.log.debug(`hub not initialized: ${err.toString()}`);
            return;
        }
    }

    async clientStop(hub: string): Promise<void> {
        await this.setConnected(hub, false);
        await this.setBlocked(hub, false);
        if (this.hubs[hub]) {
            this.hubs[hub]?.client?.close();
            this.hubs[hub].client = null;
        }
    }

    connect(hub: string, hubObj: HubDataConfig): void {
        if (!this.hubs[hub] || this.hubs[hub].client !== null) {
            return;
        }

        const client = new HarmonyWS(hubObj.ip);
        this.hubs[hub].client = client;

        client.on('online', (): void => {
            void (async (): Promise<void> => {
                await this.setBlocked(hub, true);
                await this.setConnected(hub, true);
                this.log.info(`[CONNECT] Connected to ${hubObj.friendlyName} (${hubObj.ip})`);
                this.hubs[hub].client.requestConfig();
            })().catch(err => this.log.warn(`[CONNECT] online handler failed: ${(err as Error)?.message ?? err}`));
        });

        client.on('offline', (): void => {
            void (async (): Promise<void> => {
                if (this.hubs[hub].connected) {
                    this.log.info(`[CONNECT] lost Connection to ${hubObj.friendlyName} (${hubObj.ip})`);
                }
                await this.setConnected(hub, false);
                await this.setBlocked(hub, false);
            })().catch(err => this.log.warn(`[CONNECT] offline handler failed: ${(err as Error)?.message ?? err}`));
        });

        client.on(
            'config',
            async (config: {
                activityId: string;
                activityStatus: number;
                cmd: string;
                type: string;
                activity: {
                    label: string;
                    id: string;
                    sequences: string;
                    controlGroup: string;
                    fixit: string;
                    rules: string;
                }[];
                device: {
                    label: string;
                    id: string;
                    controlGroup: {
                        name: string;
                        function: {
                            name: string;
                            action: string;
                            type: string | number;
                            controlGroup?: string;
                            deviceId?: string;
                        }[];
                    }[];
                }[];
            }): Promise<void> => {
                try {
                    await this.processConfig(hub, hubObj, config);
                    // after config is processed, request current state
                    this.hubs[hub].client.requestState();
                } catch (e) {
                    this.log.error(e);
                }
            },
        );

        client.on('state', (activityId: string, activityStatus: number): void => {
            this.processDigest(hub, activityId, activityStatus).catch(err =>
                this.log.warn(`[STATE] digest failed: ${(err as Error)?.message ?? err}`),
            );
        });
    }

    async processConfig(
        hub: string,
        hubObj: HubDataConfig,
        config: {
            activityId: string;
            activityStatus: number;
            cmd: string;
            type: string;
            activity: {
                label: string;
                id: string;
                sequences: string;
                controlGroup: string;
                fixit: string;
                rules: string;
            }[];
            device: {
                label: string;
                id: string;
                controlGroup: {
                    name: string;
                    function: {
                        name: string;
                        action: string;
                        type: string | number;
                        controlGroup?: string;
                        deviceId?: string;
                    }[];
                }[];
            }[];
        },
    ): Promise<void> {
        if (this.hubs[hub].isSync) {
            await this.setBlocked(hub, false);
            await this.setConnected(hub, true);
            return;
        }
        /* create hub */
        this.log.debug('[PROCESS] Creating activities and devices');

        this.log.debug('[PROCESS] Creating hub device');
        await this.setObjectAsync(hub, {
            type: 'device',
            common: {
                name: hub,
            },
            native: hubObj,
        });

        if (!this.hubs[hub].statesExist) {
            await this.setObjectAsync(`${hub}.hubConnected`, {
                type: 'state',
                common: {
                    name: `${hub}:hubConnected`,
                    role: 'indicator.connected',
                    type: 'boolean',
                    write: false,
                    read: true,
                },
                native: {},
            });
        }
        await this.setStateAsync(`${hub}.hubConnected`, { val: true, ack: true });

        if (!this.hubs[hub].statesExist) {
            await this.setObjectAsync(`${hub}.hubBlocked`, {
                type: 'state',
                common: {
                    name: `${hub}:hubBlocked`,
                    role: 'indicator.hubBlocked',
                    type: 'boolean',
                    write: false,
                    read: true,
                },
                native: {},
            });
        }
        await this.setStateAsync(`${hub}.hubBlocked`, { val: true, ack: true });

        /* create activities */
        this.log.debug('creating activities');
        let channelName = `${hub}.activities`;
        // create a channel for activities
        await this.setObjectAsync(channelName, {
            type: 'channel',
            common: {
                name: 'activities',
                role: 'media.activities',
            },
            native: {},
        });

        if (!this.hubs[hub].statesExist) {
            await this.setObjectAsync(`${channelName}.currentActivity`, {
                type: 'state',
                common: {
                    name: 'activity:currentActivity',
                    role: 'indicator.activity',
                    type: 'string',
                    write: true,
                    read: true,
                },
                native: {},
            });
            await this.setObjectAsync(`${channelName}.currentStatus`, {
                type: 'state',
                common: {
                    name: 'activity:currentStatus',
                    role: 'indicator.status',
                    type: 'number',
                    write: true,
                    read: true,
                    min: 0,
                    max: 3,
                    states: ACTIVITY_STATUS_STATES,
                },
                native: {},
            });
        }

        for (const activity of config.activity) {
            const activityLabel = fixId(activity.label);
            this.hubs[hub].activities[activity.id] = activityLabel;
            this.hubs[hub].activitiesReverse[activityLabel] = activity.id;
            if (activity.id === '-1') {
                // ignore power off
                continue;
            }
            // create activities
            const activityChannelName = `${channelName}.${activityLabel}`;
            // create a channel for activity
            delete activity.sequences;
            delete activity.controlGroup;
            delete activity.fixit;
            delete activity.rules;

            // create states for activity
            if (!Object.prototype.hasOwnProperty.call(this.hubs[hub].ioStates, activityLabel)) {
                this.log.info(`[PROCESS] Added new activity: ${activityLabel}`);
                await this.setObjectAsync(activityChannelName, {
                    type: 'state',
                    common: {
                        name: `activity:${activityLabel}`,
                        role: 'level',
                        type: 'number',
                        write: true,
                        read: true,
                        min: 0,
                        max: 3,
                        states: ACTIVITY_STATUS_STATES,
                    },
                    native: activity,
                });
            }

            await this.setObjectNotExistsAsync(`${activityChannelName}-control`, {
                type: 'state',
                common: {
                    name: `Control for activity: ${activityLabel}`,
                    role: 'switch',
                    type: 'boolean',
                    write: true,
                    read: true,
                },
                native: activity,
            });
            delete this.hubs[hub].ioStates[activityLabel];
            delete this.hubs[hub].ioStates[`${activityLabel}-control`];
        }

        // create devices
        this.log.debug('[PROCESS] Creating devices');
        channelName = hub;
        for (const device of config.device) {
            const deviceLabel = fixId(device.label);
            const deviceChannelName = `${channelName}.${deviceLabel}`;
            const controlGroup = device.controlGroup;
            this.hubs[hub].devices[device.id] = deviceLabel;
            this.hubs[hub].devicesReverse[deviceLabel] = device.id;
            delete device.controlGroup;
            // create a channel for a device
            if (!Object.prototype.hasOwnProperty.call(this.hubs[hub].ioChannels, deviceLabel)) {
                this.log.info(`[PROCESS] Added new device: ${deviceLabel}`);
                await this.setObjectAsync(deviceChannelName, {
                    type: 'channel',
                    common: {
                        name: deviceLabel,
                        role: 'media.device',
                    },
                    native: device,
                });
                for (const cg of controlGroup) {
                    const groupName = cg.name;
                    for (const command of cg.function) {
                        command.controlGroup = groupName;
                        command.deviceId = device.id;
                        const commandName = fixId(command.name);
                        // create command
                        await this.setObjectAsync(`${deviceChannelName}.${commandName}`, {
                            type: 'state',
                            common: {
                                name: `${deviceLabel}:${commandName}`,
                                role: 'button',
                                type: 'number',
                                write: true,
                                read: true,
                                min: 0,
                            },
                            native: command,
                        });
                        void this.setState(`${deviceChannelName}.${commandName}`, { val: 0, ack: true });
                    }
                }
            }
            delete this.hubs[hub].ioChannels[deviceLabel];
        }

        this.log.debug('[PROCESS] Deleting activities');
        for (const activityLabel in this.hubs[hub].ioStates) {
            this.log.info(`[PROCESS] Removed old activity: ${activityLabel}`);
            await this.delObjectAsync(`${hub}.activities.${activityLabel}`);
        }

        this.log.debug('[PROCESS] Deleting devices');
        for (const deviceLabel in this.hubs[hub].ioChannels) {
            this.log.info(`[PROCESS] Removed old device: ${deviceLabel}`);
            await this.delObjectAsync(`${hub}.${deviceLabel}`);
        }

        this.hubs[hub].statesExist = true;
        await this.setBlocked(hub, false);
        await this.setConnected(hub, true);
        this.hubs[hub].isSync = true;
        this.log.info(`[PROCESS] Synced hub config for ${hubObj.friendlyName} (${hubObj.ip})`);
    }

    async processDigest(hub: string, activityId: string, activityStatus: number): Promise<void> {
        // set hub activity to the current activity label
        await this.setCurrentActivity(hub, activityId);
        // Set hub status to the current activity status
        await this.setCurrentStatus(hub, activityStatus);

        if (activityId !== '-1') {
            // if activityId is not powerOff
            // set activityId's status
            await this.setStatusFromActivityID(hub, activityId, activityStatus);

            // if status is 'running' set all other activities to 'off'
            if (activityStatus === 2) {
                // only one activity can run at once, set all other activities to off
                for (const activity in this.hubs[hub].activities) {
                    if (
                        Object.prototype.hasOwnProperty.call(this.hubs[hub].activities, activity) &&
                        activity !== activityId
                    ) {
                        await this.setStatusFromActivityID(hub, activity, 0);
                    }
                }
            }
        } else {
            // set all activities to 'off' since powerOff activity is active
            for (const oActivity in this.hubs[hub].activities) {
                if (Object.prototype.hasOwnProperty.call(this.hubs[hub].activities, oActivity)) {
                    await this.setStatusFromActivityID(hub, oActivity, 0);
                }
            }
        }
    }

    async setCurrentActivity(hub: string, id: string): Promise<void> {
        if (!Object.prototype.hasOwnProperty.call(this.hubs[hub].activities, id)) {
            this.log.debug(`[SETACTIVITY] Unknown activityId: ${id}`);
            return;
        }
        this.log.debug(`current activity: ${this.hubs[hub].activities[id]}`);
        await this.setStateAsync(`${hub}.activities.currentActivity`, {
            val: this.hubs[hub].activities[id],
            ack: true,
        });
    }

    async setCurrentStatus(hub: string, status: number): Promise<void> {
        if (this.hubs[hub].statesExist) {
            await this.setStateAsync(`${hub}.activities.currentStatus`, { val: status, ack: true });
        }
    }

    async setStatusFromActivityID(hub: string, id: string, value: number): Promise<void> {
        if (id === '-1') {
            return;
        }
        if (!Object.prototype.hasOwnProperty.call(this.hubs[hub].activities, id)) {
            this.log.warn(`[SETSTATE] Unknown activityId: ${id}`);
            return;
        }
        const channelName = `${hub}.activities.${this.hubs[hub].activities[id]}`;
        await this.setStateAsync(channelName, { val: value, ack: true });
        await this.setStateAsync(`${channelName}-control`, { val: !!value, ack: true });
    }

    async setBlocked(hub: string, bool: boolean): Promise<void> {
        if (this.hubs[hub] && this.hubs[hub].statesExist) {
            bool = Boolean(bool);
            await this.setStateAsync(`${hub}.hubBlocked`, { val: bool, ack: true });
            this.hubs[hub].blocked = bool;
        }
    }

    async setConnected(hub: string, bool: boolean): Promise<void> {
        if (this.hubs[hub] && this.hubs[hub].statesExist) {
            bool = Boolean(bool);
            this.hubs[hub].connected = bool;
            await this.setStateAsync(`${hub}.hubConnected`, { val: bool, ack: true });
        }
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<AdapterOptions> | undefined) => new HarmonyAdapter(options);
} else {
    // otherwise start the instance directly
    (() => new HarmonyAdapter())();
}
