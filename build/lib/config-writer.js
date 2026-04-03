"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigWriter = void 0;
/**
 * Writes configuration changes to Harmony Hubs via WebSocket.
 *
 * CRITICAL RULES (from reverse engineering):
 * - Every write MUST include `forceUpdate: true` or changes are lost on hub restart
 * - Every write MUST be followed by `home.hub.sync`
 * - Activity generation can take 10+ seconds, use 60000ms timeout
 * - Don't batch multiple writes - sync between each one
 */
class ConfigWriter {
    constructor(adapter) {
        this.msgCounter = 0;
        this.adapter = adapter;
    }
    /**
     * Send a raw command to the hub's WebSocket and wait for the matching response.
     */
    sendCommand(hubName, cmd, params, timeout = 30000) {
        var _a;
        const hub = this.adapter.hubs[hubName];
        if (!((_a = hub === null || hub === void 0 ? void 0 : hub.client) === null || _a === void 0 ? void 0 : _a._ws)) {
            return Promise.reject(new Error(`Hub not found or offline: ${hubName}`));
        }
        const ws = hub.client._ws;
        const id = `config-writer-${++this.msgCounter}-${Date.now()}`;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                ws.removeListener('message', onMessage);
                reject(new Error(`Command '${cmd}' timed out after ${timeout}ms`));
            }, timeout);
            const onMessage = (raw) => {
                var _a;
                try {
                    const data = JSON.parse(raw);
                    if (((_a = data === null || data === void 0 ? void 0 : data.hbus) === null || _a === void 0 ? void 0 : _a.id) === id) {
                        clearTimeout(timer);
                        ws.removeListener('message', onMessage);
                        if (data.hbus.error) {
                            reject(new Error(`Hub error for '${cmd}': ${JSON.stringify(data.hbus.error)}`));
                        }
                        else {
                            resolve(data.hbus);
                        }
                    }
                }
                catch {
                    // Ignore non-JSON messages
                }
            };
            ws.on('message', onMessage);
            const message = JSON.stringify({
                hbus: { cmd, id, params },
            });
            this.adapter.log.debug(`ConfigWriter sending: ${cmd} (id=${id})`);
            ws.send(message);
        });
    }
    /**
     * Sync the hub to persist all pending changes.
     */
    async syncHub(hubName) {
        try {
            await this.sendCommand(hubName, 'home.hub.sync', {});
            this.adapter.log.info(`Hub '${hubName}' sync completed`);
            return { success: true, data: { synced: true } };
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.adapter.log.error(`syncHub failed: ${msg}`);
            return { success: false, error: msg };
        }
    }
    /**
     * Write configuration changes via proxy.resource?put with forceUpdate.
     */
    async writeConfig(hubName, changes) {
        try {
            const params = { ...changes, forceUpdate: true };
            await this.sendCommand(hubName, 'proxy.resource?put', params);
            this.adapter.log.debug(`writeConfig: proxy.resource?put succeeded for '${hubName}'`);
            await this.sendCommand(hubName, 'home.hub.sync', {});
            this.adapter.log.info(`writeConfig: sync completed for '${hubName}'`);
            return { success: true, data: { written: true } };
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.adapter.log.error(`writeConfig failed: ${msg}`);
            return { success: false, error: msg };
        }
    }
    /**
     * Add a new device to the hub, then sync.
     */
    async addDevice(hubName, device) {
        try {
            const params = { ...device, forceUpdate: true };
            const result = await this.sendCommand(hubName, 'home.hub.device.add', params);
            this.adapter.log.debug(`addDevice: device added to '${hubName}'`);
            await this.sendCommand(hubName, 'home.hub.sync', {});
            this.adapter.log.info(`addDevice: sync completed for '${hubName}'`);
            return { success: true, data: result };
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.adapter.log.error(`addDevice failed: ${msg}`);
            return { success: false, error: msg };
        }
    }
    /**
     * Delete a device from the hub, then sync.
     */
    async deleteDevice(hubName, deviceId) {
        try {
            const params = { deviceId, forceUpdate: true };
            await this.sendCommand(hubName, 'home.hub.device.delete', params);
            this.adapter.log.debug(`deleteDevice: device '${deviceId}' deleted from '${hubName}'`);
            await this.sendCommand(hubName, 'home.hub.sync', {});
            this.adapter.log.info(`deleteDevice: sync completed for '${hubName}'`);
            return { success: true, data: { deleted: true } };
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.adapter.log.error(`deleteDevice failed: ${msg}`);
            return { success: false, error: msg };
        }
    }
    /**
     * Save (update) a device on the hub, then sync.
     */
    async saveDevice(hubName, device) {
        try {
            const params = { ...device, forceUpdate: true };
            await this.sendCommand(hubName, 'home.hub.device.save', params);
            this.adapter.log.debug(`saveDevice: device saved on '${hubName}'`);
            await this.sendCommand(hubName, 'home.hub.sync', {});
            this.adapter.log.info(`saveDevice: sync completed for '${hubName}'`);
            return { success: true, data: { saved: true } };
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.adapter.log.error(`saveDevice failed: ${msg}`);
            return { success: false, error: msg };
        }
    }
    /**
     * Generate an activity on the hub. Uses 60s timeout since generation can take 10+ seconds.
     */
    async generateActivity(hubName, activityDef) {
        try {
            const params = { ...activityDef, forceUpdate: true };
            const result = await this.sendCommand(hubName, 'home.hub.activity.generate', params, 60000);
            this.adapter.log.debug(`generateActivity: activity generated on '${hubName}'`);
            await this.sendCommand(hubName, 'home.hub.sync', {});
            this.adapter.log.info(`generateActivity: sync completed for '${hubName}'`);
            return { success: true, data: result };
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.adapter.log.error(`generateActivity failed: ${msg}`);
            return { success: false, error: msg };
        }
    }
    /**
     * Update activity roles on the hub, then sync.
     */
    async updateActivityRoles(hubName, roles) {
        try {
            const params = { ...roles, forceUpdate: true };
            await this.sendCommand(hubName, 'home.hub.activity.updateRoles', params);
            this.adapter.log.debug(`updateActivityRoles: roles updated on '${hubName}'`);
            await this.sendCommand(hubName, 'home.hub.sync', {});
            this.adapter.log.info(`updateActivityRoles: sync completed for '${hubName}'`);
            return { success: true, data: { updated: true } };
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.adapter.log.error(`updateActivityRoles failed: ${msg}`);
            return { success: false, error: msg };
        }
    }
    /**
     * Delete an activity from the hub, then sync.
     */
    async deleteActivity(hubName, activityId) {
        try {
            const params = { activityId, forceUpdate: true };
            await this.sendCommand(hubName, 'home.hub.activity.delete', params);
            this.adapter.log.debug(`deleteActivity: activity '${activityId}' deleted from '${hubName}'`);
            await this.sendCommand(hubName, 'home.hub.sync', {});
            this.adapter.log.info(`deleteActivity: sync completed for '${hubName}'`);
            return { success: true, data: { deleted: true } };
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.adapter.log.error(`deleteActivity failed: ${msg}`);
            return { success: false, error: msg };
        }
    }
}
exports.ConfigWriter = ConfigWriter;
//# sourceMappingURL=config-writer.js.map