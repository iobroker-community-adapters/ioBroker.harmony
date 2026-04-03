import type { MessageResponse, HarmonyHubInfo } from './types.js';
import { ConfigWriter } from './config-writer.js';

export class MessageHandler {
    private adapter: any;
    private writer: ConfigWriter;

    constructor(adapter: any) {
        this.adapter = adapter;
        this.writer = new ConfigWriter(adapter);
    }

    async handle(obj: ioBroker.Message): Promise<void> {
        if (!obj?.command) return;

        let response: MessageResponse;
        try {
            switch (obj.command) {
                case 'getHubs':
                    response = this.getHubs();
                    break;
                case 'getConfig':
                    response = await this.getConfig(obj.message as { hubName: string });
                    break;
                case 'getStateDigest':
                    response = await this.getStateDigest(obj.message as { hubName: string });
                    break;
                case 'testCommand':
                    response = await this.testCommand(obj.message as { hubName: string; deviceId: string; command: string; type: string });
                    break;
                case 'writeConfig':
                    response = await this.writer.writeConfig(
                        (obj.message as { hubName: string; changes: Record<string, unknown> }).hubName,
                        (obj.message as { hubName: string; changes: Record<string, unknown> }).changes,
                    );
                    break;
                case 'addDevice':
                    response = await this.writer.addDevice(
                        (obj.message as { hubName: string; device: Record<string, unknown> }).hubName,
                        (obj.message as { hubName: string; device: Record<string, unknown> }).device,
                    );
                    break;
                case 'deleteDevice':
                    response = await this.writer.deleteDevice(
                        (obj.message as { hubName: string; deviceId: string }).hubName,
                        (obj.message as { hubName: string; deviceId: string }).deviceId,
                    );
                    break;
                case 'saveDevice':
                    response = await this.writer.saveDevice(
                        (obj.message as { hubName: string; device: Record<string, unknown> }).hubName,
                        (obj.message as { hubName: string; device: Record<string, unknown> }).device,
                    );
                    break;
                case 'generateActivity':
                    response = await this.writer.generateActivity(
                        (obj.message as { hubName: string; activityDef: Record<string, unknown> }).hubName,
                        (obj.message as { hubName: string; activityDef: Record<string, unknown> }).activityDef,
                    );
                    break;
                case 'updateActivityRoles':
                    response = await this.writer.updateActivityRoles(
                        (obj.message as { hubName: string; roles: Record<string, unknown> }).hubName,
                        (obj.message as { hubName: string; roles: Record<string, unknown> }).roles,
                    );
                    break;
                case 'deleteActivity':
                    response = await this.writer.deleteActivity(
                        (obj.message as { hubName: string; activityId: string }).hubName,
                        (obj.message as { hubName: string; activityId: string }).activityId,
                    );
                    break;
                case 'syncHub':
                    response = await this.writer.syncHub(
                        (obj.message as { hubName: string }).hubName,
                    );
                    break;
                default:
                    response = { success: false, error: `Unknown command: ${obj.command}` };
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            this.adapter.log.error(`Message handler error: ${msg}`);
            response = { success: false, error: msg };
        }

        if (obj.callback) {
            this.adapter.sendTo(obj.from, obj.command, response, obj.callback);
        }
    }

    private getHubs(): MessageResponse {
        const hubs: HarmonyHubInfo[] = [];
        for (const [name, hub] of Object.entries(this.adapter.hubs as Record<string, any>)) {
            hubs.push({
                name,
                ip: '',
                uuid: '',
                firmware: '',
                hubType: '',
                remoteId: '',
                connected: hub.connected || false,
                activities: Object.keys(hub.activities || {}).length,
                devices: Object.keys(hub.devices || {}).length,
            });
        }
        return { success: true, data: hubs };
    }

    private async getConfig(msg: { hubName: string }): Promise<MessageResponse> {
        if (!msg?.hubName) return { success: false, error: 'hubName required' };
        const hub = this.adapter.hubs[msg.hubName];
        if (!hub?.client) return { success: false, error: `Hub not found or offline: ${msg.hubName}` };

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ success: false, error: 'Config request timed out' });
            }, 30000);

            hub.client.requestConfig();
            hub.client.once('config', (config: unknown) => {
                clearTimeout(timeout);
                resolve({ success: true, data: config });
            });
        });
    }

    private async getStateDigest(msg: { hubName: string }): Promise<MessageResponse> {
        if (!msg?.hubName) return { success: false, error: 'hubName required' };
        const hub = this.adapter.hubs[msg.hubName];
        if (!hub?.client) return { success: false, error: `Hub not found: ${msg.hubName}` };

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ success: false, error: 'State request timed out' });
            }, 10000);

            hub.client.requestState();
            hub.client.once('state', (state: unknown) => {
                clearTimeout(timeout);
                resolve({ success: true, data: state });
            });
        });
    }

    private async testCommand(msg: { hubName: string; deviceId: string; command: string; type: string }): Promise<MessageResponse> {
        if (!msg?.hubName || !msg?.command) return { success: false, error: 'hubName and command required' };
        const hub = this.adapter.hubs[msg.hubName];
        if (!hub?.client) return { success: false, error: `Hub not found: ${msg.hubName}` };

        const action = JSON.stringify({
            command: msg.command,
            type: msg.type || 'IRCommand',
            deviceId: msg.deviceId,
        });

        try {
            hub.client.requestKeyPress(action, 'press', 100);
            return { success: true, data: { sent: true } };
        } catch (e: unknown) {
            const errMsg = e instanceof Error ? e.message : String(e);
            return { success: false, error: errMsg };
        }
    }
}
