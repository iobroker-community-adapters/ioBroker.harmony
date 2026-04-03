"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageHandler = void 0;
const config_writer_js_1 = require("./config-writer.js");
class MessageHandler {
    constructor(adapter) {
        this.adapter = adapter;
        this.writer = new config_writer_js_1.ConfigWriter(adapter);
    }
    async handle(obj) {
        if (!(obj === null || obj === void 0 ? void 0 : obj.command))
            return;
        let response;
        try {
            switch (obj.command) {
                case 'getHubs':
                    response = this.getHubs();
                    break;
                case 'getConfig':
                    response = await this.getConfig(obj.message);
                    break;
                case 'getStateDigest':
                    response = await this.getStateDigest(obj.message);
                    break;
                case 'testCommand':
                    response = await this.testCommand(obj.message);
                    break;
                case 'writeConfig':
                    response = await this.writer.writeConfig(obj.message.hubName, obj.message.changes);
                    break;
                case 'addDevice':
                    response = await this.writer.addDevice(obj.message.hubName, obj.message.device);
                    break;
                case 'deleteDevice':
                    response = await this.writer.deleteDevice(obj.message.hubName, obj.message.deviceId);
                    break;
                case 'saveDevice':
                    response = await this.writer.saveDevice(obj.message.hubName, obj.message.device);
                    break;
                case 'generateActivity':
                    response = await this.writer.generateActivity(obj.message.hubName, obj.message.activityDef);
                    break;
                case 'updateActivityRoles':
                    response = await this.writer.updateActivityRoles(obj.message.hubName, obj.message.roles);
                    break;
                case 'deleteActivity':
                    response = await this.writer.deleteActivity(obj.message.hubName, obj.message.activityId);
                    break;
                case 'syncHub':
                    response = await this.writer.syncHub(obj.message.hubName);
                    break;
                default:
                    response = { success: false, error: `Unknown command: ${obj.command}` };
            }
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.adapter.log.error(`Message handler error: ${msg}`);
            response = { success: false, error: msg };
        }
        if (obj.callback) {
            this.adapter.sendTo(obj.from, obj.command, response, obj.callback);
        }
    }
    getHubs() {
        const hubs = [];
        for (const [name, hub] of Object.entries(this.adapter.hubs)) {
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
    async getConfig(msg) {
        if (!(msg === null || msg === void 0 ? void 0 : msg.hubName))
            return { success: false, error: 'hubName required' };
        const hub = this.adapter.hubs[msg.hubName];
        if (!(hub === null || hub === void 0 ? void 0 : hub.client))
            return { success: false, error: `Hub not found or offline: ${msg.hubName}` };
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ success: false, error: 'Config request timed out' });
            }, 30000);
            hub.client.requestConfig();
            hub.client.once('config', (config) => {
                clearTimeout(timeout);
                resolve({ success: true, data: config });
            });
        });
    }
    async getStateDigest(msg) {
        if (!(msg === null || msg === void 0 ? void 0 : msg.hubName))
            return { success: false, error: 'hubName required' };
        const hub = this.adapter.hubs[msg.hubName];
        if (!(hub === null || hub === void 0 ? void 0 : hub.client))
            return { success: false, error: `Hub not found: ${msg.hubName}` };
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ success: false, error: 'State request timed out' });
            }, 10000);
            hub.client.requestState();
            hub.client.once('state', (state) => {
                clearTimeout(timeout);
                resolve({ success: true, data: state });
            });
        });
    }
    async testCommand(msg) {
        if (!(msg === null || msg === void 0 ? void 0 : msg.hubName) || !(msg === null || msg === void 0 ? void 0 : msg.command))
            return { success: false, error: 'hubName and command required' };
        const hub = this.adapter.hubs[msg.hubName];
        if (!(hub === null || hub === void 0 ? void 0 : hub.client))
            return { success: false, error: `Hub not found: ${msg.hubName}` };
        const action = JSON.stringify({
            command: msg.command,
            type: msg.type || 'IRCommand',
            deviceId: msg.deviceId,
        });
        try {
            hub.client.requestKeyPress(action, 'press', 100);
            return { success: true, data: { sent: true } };
        }
        catch (e) {
            const errMsg = e instanceof Error ? e.message : String(e);
            return { success: false, error: errMsg };
        }
    }
}
exports.MessageHandler = MessageHandler;
//# sourceMappingURL=message-handler.js.map