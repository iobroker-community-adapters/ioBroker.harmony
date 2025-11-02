/**
 *
 *      ioBroker Logitech Harmony Adapter
 *
 *      MIT License
 *
 */
import { Adapter, type AdapterOptions } from '@iobroker/adapter-core';

import { Explorer, type HubData as HubDataConfig, ExplorerEvents } from './discover/lib';
// @ts-expect-error -- no types available
import createSemaphore from 'semaphore';
// @ts-expect-error -- no types available
import HarmonyWS from 'harmonyhubws';
import type { HarmonyAdapterConfig } from './types';
const FORBIDDEN_CHARS = /[\][*,;'"`<>\\? ]/g;
const fixId = (id: string): string => id.replace(FORBIDDEN_CHARS, '_');

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

export class HarmonyAdapter extends Adapter {
    declare config: HarmonyAdapterConfig;
    private hubs: { [id: string]: HubData } = {};
    private discover: null | Explorer = null;
    private manualDiscoverHubs: { ip: string }[] = [];
    private subnet: string[] = [];
    private discoverInterval: number = 0;

    public constructor(options: Partial<AdapterOptions> = {}) {
        super({
            ...options,
            name: 'harmony',
            ready: () => this.main(),
            stateChange: (id, state): void => this.onStateChange(id, state),
            unload: async (callback: () => void): Promise<void> => {
                try {
                    this.log.info('[END] Terminating');
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
            await this.setBlocked(hub, true);
            await this.processStateChange(hub, id, state);
            if (semaphore.current === 1) {
                await this.setBlocked(hub, false);
            }
            semaphore.leave();
        });
    }

    async processStateChange(hub: string, id: string, state: ioBroker.State): Promise<void> {
        const tmp = id.split('.');
        let channel = ``;
        let name = ``;
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

    main(): void {
        this.manualDiscoverHubs = this.config.devices || [];
        this.subnet = this.config.subnet.split(',').map(s => s.trim()) || ['255.255.255.255'];
        this.discoverInterval = parseInt(this.config.discoverInterval as string, 10) || 1000;
        this.subscribeStates('*');
        this.log.debug(`[START] Subnet: ${this.subnet.join(', ')}, Discovery interval: ${this.discoverInterval}`);
        this.discoverStart();
    }

    discoverStart(): void {
        if (this.discover) {
            this.log.debug('[DISCOVER] Discover already started');
            return;
        }

        this.getPort(61991, port => {
            this.discover = new Explorer(port, { address: this.subnet, port: 5224, interval: this.discoverInterval });
            this.discover.on(ExplorerEvents.ONLINE, async (hub: HubDataConfig): Promise<void> => {
                // Triggered when a new hub was found
                if (hub.friendlyName !== undefined) {
                    let addHub = false;
                    const hubName = fixId(hub.friendlyName).replace('.', '_');

                    if (this.manualDiscoverHubs.length) {
                        for (const manualDiscoverHub of this.manualDiscoverHubs) {
                            if (manualDiscoverHub.ip === hub.ip && !this.hubs[hubName]) {
                                this.log.info(
                                    `[DISCOVER] Discovered ${hub.friendlyName} (${hub.ip}) and will try to connect`,
                                );
                                addHub = true;
                            } else if (!this.hubs[hubName]) {
                                this.log
                                    .debug(`[DISCOVER] Discovered ${hub.friendlyName} (${hub.ip}) but won't try to connect, because
 manual search is configured and hub's ip not listed`);
                            }
                        } // endFor
                    } else if (!this.hubs[hubName]) {
                        this.log.info(`[DISCOVER] Discovered ${hub.friendlyName} (${hub.ip}) and will try to connect`);
                        addHub = true; // if no manual discovery --> add all this.hubs
                    }

                    if (addHub) {
                        await this.initHub(hubName);
                        // wait 2 seconds for hub before connecting
                        this.log.info(`[CONNECT] Connecting to ${hub.friendlyName} (${hub.ip})`);
                        this.connect(hubName, hub);
                    }
                }
            });

            this.discover.on('error', (err: Error): void => this.log.warn(`[DISCOVER] Discover error: ${err.message}`));

            this.discover.start();
            this.log.info(`[DISCOVER] Searching for Harmony Hubs on ${this.subnet.join(', ')}`);
        });
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
            if (!states) {
                for (const state in states) {
                    if (Object.prototype.hasOwnProperty.call(states, state)) {
                        const tmp = state.split('.');
                        const name = tmp.pop();
                        if (name !== 'currentStatus' && name !== 'currentActivity') {
                            this.hubs[hub].ioStates[name] = true;
                        }
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

        client.on('online', async (): Promise<void> => {
            await this.setBlocked(hub, true);
            await this.setConnected(hub, true);
            this.log.info(`[CONNECT] Connected to ${hubObj.friendlyName} (${hubObj.ip})`);
            this.hubs[hub].client.requestConfig();
        });

        client.on('offline', async (): Promise<void> => {
            if (this.hubs[hub].connected) {
                this.log.info(`[CONNECT] lost Connection to ${hubObj.friendlyName} (${hubObj.ip})`);
            }
            await this.setConnected(hub, false);
            await this.setBlocked(hub, false);
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

        client.on('state', async (activityId: string, activityStatus: number): Promise<void> => {
            await this.processDigest(hub, activityId, activityStatus);
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
        //create channel for activities
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
                },
                native: {},
            });
        }

        for (const activity of config.activity) {
            const activityLabel = fixId(activity.label).replace('.', '_');
            this.hubs[hub].activities[activity.id] = activityLabel;
            this.hubs[hub].activitiesReverse[activityLabel] = activity.id;
            if (activity.id === '-1') {
                return;
            }
            // create activities
            const activityChannelName = `${channelName}.${activityLabel}`;
            // create channel for activity
            delete activity.sequences;
            delete activity.controlGroup;
            delete activity.fixit;
            delete activity.rules;
            //create states for activity
            if (!Object.prototype.hasOwnProperty.call(this.hubs[hub].ioStates, activityLabel)) {
                this.log.info(`[PROCESS] Added new activity: ${activityLabel}`);
                await this.setObjectAsync(activityChannelName, {
                    type: 'state',
                    common: {
                        name: `activity:${activityLabel}`,
                        role: 'switch',
                        type: 'number',
                        write: true,
                        read: true,
                        min: 0,
                        max: 3,
                    },
                    native: activity,
                });
            }
            delete this.hubs[hub].ioStates[activityLabel];
        }

        /* create devices */
        this.log.debug('[PROCESS] Creating devices');
        channelName = hub;
        for (const device of config.device) {
            const deviceLabel = fixId(device.label).replace('.', '_');
            const deviceChannelName = `${channelName}.${deviceLabel}`;
            const controlGroup = device.controlGroup;
            this.hubs[hub].devices[device.id] = deviceLabel;
            this.hubs[hub].devicesReverse[deviceLabel] = device.id;
            delete device.controlGroup;
            // create channel for device
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
                        const commandName = fixId(command.name).replace('.', '_');
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
                        void this.setState(`${deviceChannelName}.${commandName}`, { val: '0', ack: true });
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
        // set hub activity to current activity label
        await this.setCurrentActivity(hub, activityId);
        // Set hub status to current activity status
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
        const channelName = fixId(`${hub}.activities.${this.hubs[hub].activities[id]}`);
        await this.setStateAsync(channelName, { val: value, ack: true });
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
