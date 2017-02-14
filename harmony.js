/**
 *
 *      ioBroker Logitech Harmony Adapter
 *
 *      MIT License
 *
 */
/* jshint -W097 */// jshint strict:false
/*jslint node: true */
"use strict";

var harmony = require('harmonyhubjs-client');
var HarmonyHubDiscover = require('harmonyhubjs-discover');
var utils = require(__dirname + '/lib/utils'); // Get common adapter utils
var adapter = utils.adapter('harmony');
var hubs = {};
var discover;


adapter.on('stateChange', function (id, state) {
    if (!id || !state || state.ack) {
        return;
    }
    var hub = id.split(".")[2];
    if (!hubs[hub]) return;
    var semaphore = hubs[hub].semaphore;
    if (semaphore === undefined) {
        adapter.log.warn("state changed in offline hub");
        return;
    }
    if (semaphore.current > 0) {
        adapter.log.info('hub busy, stateChange delayed: ' + id + '=' + state.val);
    }
    semaphore.take(function () {
        setBlocked(hub, true);
        processStateChange(hub, id, state, function () {
            if (semaphore.current == 1) {
                setBlocked(hub, false);
            }
            semaphore.leave();
        });
    });
});

function processStateChange(hub, id, state, callback) {
    var tmp = id.split('.');
    var channel = "";
    var name = "";
    if (tmp.length == 5) {
        name = tmp.pop();
        channel = tmp.pop();
    } else {
        adapter.log.warn('unknown state change');
        return;
    }
    switch (channel) {
        case 'activities':
            switch (name) {
                case 'currentStatus':
                    switchActivity(hub, undefined, 0, callback);
                    break;
                case 'currentActivity':
                    adapter.log.warn('change activities, not currentActivity');
                    callback();
                    break;
                default:
                    switchActivity(hub, name, state.val, callback);
                    break;
            }
            break;
        default:
            adapter.log.debug('sending command: ' + channel + ':' + name);
            if (state.val) {
                var ms = parseInt(state.val);
                if (isNaN(ms) || ms < 100) {
                    ms = 100;
                }
                sendCommand(hub, id, ms, callback);
            } else {
                adapter.setState(id, {val: 0, ack: true});
                callback();
            }
            break;
    }
}

function sendCommand(hub, id, ms, callback) {
    adapter.getObject(id, function (err, obj) {
        if (err) {
            adapter.log.warn('cannot send command, unknown state');
            adapter.setState(id, {val: 0, ack: true});
            callback();
            return;
        }
        if (!hubs[hub].client) {
            adapter.log.warn('error sending command, client offline');
            adapter.setState(id, {val: 0, ack: true});
            callback();
            return;
        }
        adapter.log.debug('sending command: ' + obj.name);
        var encodedAction = obj.native.action.replace(/:/g, '::');

        var tsStart = Date.now();
        var first = true;
        (function repeat() {
            var tsNow = Date.now();
            if (tsNow - tsStart + 250 <= ms || first) {
                hubs[hub].client.send('holdAction', 'status=press:timestamp=' + (tsNow - hubs[hub].timestamp) + ':action=' + encodedAction);
                first = false;
                setTimeout(repeat, 200);
            } else {
                setTimeout(function () {
                    hubs[hub].client.send('holdAction', ':status=release:timestamp=' + (tsNow - hubs[hub].timestamp) + ':action=' + encodedAction);
                    adapter.setState(id, {val: 0, ack: true});
                    callback();
                }, Math.max(0, ms - tsNow + tsStart));
            }
        }());
    });
}

function switchActivity(hub, activityLabel, value, callback) {
    if (!hubs[hub].client) {
        adapter.log.warn('error changing activity, client offline');
        callback();
        return;
    }
    //get current Activity
    value = parseInt(value);
    if (isNaN(value)) value = 1;
    if (value === 0) {
        adapter.log.debug('turning activity off');
        hubs[hub].client.turnOff().finally(callback);
    } else if (hubs[hub].activities_reverse.hasOwnProperty(activityLabel)) {
        adapter.log.debug('switching activity to: ' + activityLabel);
        hubs[hub].client.startActivity(hubs[hub].activities_reverse[activityLabel]).finally(callback());
    } else {
        adapter.log.warn('activity does not exists');
        callback();
    }
}

adapter.on('unload', function (callback) {
    adapter.log.info('terminating');
    if (discover) {
        discover.stop();
    }
    discover = null;
    for (var hub in Object.keys(hubs)) {
        clientStop(hub);
    }
    callback();
});

adapter.on('ready', function () {
    main();
});

function main() {
    adapter.subscribeStates('*');
    discoverStart();
}

function discoverStart() {
    if (discover) {
        adapter.log.debug("discover already started");
        return;
    }
    discover = new HarmonyHubDiscover(61991);
    discover.on('online', function (hub) {
        // Triggered when a new hub was found
        if (hub.host_name !== 'undefined' && hub.host_name !== undefined) {
            adapter.log.info('discovered ' + hub.host_name);
            var hubName = hub.host_name.replace(/[.\s]+/g, '_');
            initHub(hubName, function () {
                //wait 2 seconds for hub before connecting
                adapter.log.info('connecting to ' + hub.host_name);
                hubs[hubName].reconnectTimer = setTimeout(function () {
                    connect(hubName, hub);
                }, 2000);
            });
        }
    });
    discover.on('offline', function (hub) {
        // Triggered when a hub disappeared
        if (hub.host_name !== 'undefined' && hub.host_name !== undefined) {
            adapter.log.warn('lost ' + hub.host_name);
            var hubName = hub.host_name.replace(/[.\s]+/g, '_');
            //stop reconnect timer
            if (hubs[hubName]) {
                clearTimeout(hubs[hubName].reconnectTimer);
            }
            clientStop(hubName);

        }
    });
    discover.on('error', function (er) {
        adapter.log.warn('discover error: ', er.message);
    });
    discover.start();
    adapter.log.info('searching for Harmony Hubs...');
}

function initHub(hub, callback) {
    hubs[hub] = {
        client: null,
        activities: {},
        activities_reverse: {},
        devices: {},
        devices_reverse: {},
        blocked: true,
        timestamp: null,
        statesExist: false,
        ioChannels: {},
        ioStates: {},
        isSync: false,
        reconnectTimer: 0,
        semaphore: require('semaphore')(1)
    };

    adapter.getState(hub + '.hubConnected', function (err, state) {
        if (err || !state) {
            adapter.log.debug('hub not initialized');
            callback();
        } else {
            adapter.getChannelsOf(hub, function (err, channels) {
                if (err || !channels) {
                    adapter.log.debug('hub not initialized correctly');
                    callback();
                    return;
                }
                for (var i = 0; i < channels.length; i++) {
                    var channel = channels[i];
                    if (channel.common.name == 'activities') {
                        hubs[hub].statesExist = true;
                        setBlocked(hub, true);
                        setConnected(hub, false);
                        hubs[hub].hasActivities = true;
                        adapter.log.debug('hub initialized');
                        continue;
                    }
                    hubs[hub].ioChannels[channel.common.name] = true;
                }
                adapter.getStates(hub + '.activities.*', function (err, states) {
                    if (err || !states) {
                        adapter.log.debug('no activities found');
                        callback();
                        return;
                    }
                    for (var state in states) {
                        if (states.hasOwnProperty(state)) {
                            var tmp = state.split('.');
                            var name = tmp.pop();
                            if (name != 'currentStatus' && name != 'currentActivity') {
                                hubs[hub].ioStates[name] = true;
                            }
                        }
                    }
                    callback();
                });
            });
        }
    });
}

function clientStop(hub) {
    setConnected(hub, false);
    setBlocked(hub, false);
    if (hubs[hub] && hubs[hub].client !== null) {
        hubs[hub].client._xmppClient.on('error', function (e) {
            adapter.log.debug('xmpp error: ' + e);
        });
        hubs[hub].client._xmppClient.on('offline', function () {
            adapter.log.debug('xmpp offline');
        });
        hubs[hub].client.end();
        adapter.log.info('client ended: ' + hub);
        hubs[hub].client = null;
    }
}

function connect(hub, hubObj) {
    if (!hubs[hub] || hubs[hub].client !== null) return;
    clearTimeout(hubs[hub].reconnectTimer);
    harmony(hubObj.ip).timeout(5000).then(function (harmonyClient) {
        hubs[hub].timestamp = Date.now();
        setBlocked(hub, true);
        setConnected(hub, true);
        adapter.log.info('connected to ' + hubObj.host_name);
        hubs[hub].client = harmonyClient;
        (function keepAlive() {
            if (hubs[hub].client !== null) {
                hubs[hub].client.request('getCurrentActivity').timeout(5000).then(function () {
                    setTimeout(keepAlive, 5000);
                }).catch(function (e) {
                    adapter.log.info('keep alive failed: ' + e);
                    clientStop(hub);
                    hubs[hub].reconnectTimer = setTimeout(function () {
                        connect(hub, hubObj);
                    }, 5000);
                });
            }
        }());

        //update objects on connect
        harmonyClient.getAvailableCommands().then(function (config) {
            try {
                processConfig(hub, hubObj, config);
            } catch (e) {
                adapter.log.error(e);
                clientStop(hub);
                return;
            }

            //set current activity
            harmonyClient.request('getCurrentActivity').timeout(5000).then(function (response) {
                if (response.hasOwnProperty('result')) {
                    //set hub.activity to activity label
                    setCurrentActivity(hub, response.result);

                    if (response.result != '-1') {
                        setStatusFromActivityID(hub, response.result, 2);
                        setCurrentStatus(hub, 2);
                    } else {
                        setCurrentStatus(hub, 0);
                    }
                    //set all other activities to 'off'
                    for (var activity in hubs[hub].activities) {
                        if (activity != response.result && hubs[hub].activities.hasOwnProperty(activity)) {
                            setStatusFromActivityID(hub, activity, 0);
                        }
                    }
                }

                //start listen for updates from hub
                harmonyClient.on('stateDigest', function (digest) {
                    processDigest(hub, digest);
                });
            }).catch(function (e) {
                adapter.log.warn('connection down: ' + e);
                clientStop(hub);
            });
        }).catch(function (e) {
            adapter.log.warn('could not get config: ' + e);
            clientStop(hub);
        });
    }).catch(function (e) {
        adapter.log.warn('could not connect to ' + hubObj.host_name + ': ' + e);
        clientStop(hub);
    });
}

function processConfig(hub, hubObj, config) {
    if (hubs[hub].isSync) {
        setBlocked(hub, false);
        setConnected(hub, true);
        return;
    } 
    /* create hub */
    adapter.log.debug('creating activities and devices');

    adapter.log.debug('creating hub device');
    adapter.setObject(hub, {
        type: 'device',
        common: {
            name: hub
        },
        native: hubObj
    });

    if (!hubs[hub].statesExist) {
        adapter.setObject(hub + '.hubConnected', {
            type: 'state',
            common: {
                name: hub + ':hubConnected',
                role: 'indicator.hubConnected',
                type: 'boolean',
                write: false,
                read: true
            },
            native: {}
        });
    }
    adapter.setState(hub + '.hubConnected', {val: true, ack: true});

    if (!hubs[hub].statesExist) {
        adapter.setObject(hub + '.hubBlocked', {
            type: 'state',
            common: {
                name: hub + ':hubBlocked',
                role: 'indicator.hubBlocked',
                type: 'boolean',
                write: false,
                read: true
            },
            native: {}
        });
    }
    adapter.setState(hub + '.hubBlocked', {val: true, ack: true});

    /* create activities */
    adapter.log.debug('creating activities');
    var channelName = hub + '.activities';
    //create channel for activities
    adapter.setObject(channelName, {
        type: 'channel',
        common: {
            name: 'activities',
            role: 'media.activities'
        },
        native: {}
    });

    if (!hubs[hub].statesExist) {
        adapter.setObject(channelName + '.currentActivity', {
            type: 'state',
            common: {
                name: 'activity:currentActivity',
                role: 'indicator.activity',
                type: 'string',
                write: true,
                read: true
            },
            native: {}
        });
        adapter.setObject(channelName + '.currentStatus', {
            type: 'state',
            common: {
                name: 'activity:currentStatus',
                role: 'indicator.status',
                type: 'number',
                write: true,
                read: true,
                min: 0,
                max: 3
            },
            native: {}
        });
    }

    config.activity.forEach(function (activity) {
        var activityLabel = activity.label.replace(/[.\s]+/g, '_');
        hubs[hub].activities[activity.id] = activityLabel;
        hubs[hub].activities_reverse[activityLabel] = activity.id;
        if (activity.id == '-1') return;
        //create activities
        var activityChannelName = channelName + '.' + activityLabel;
        //create channel for activity
        delete activity.sequences;
        delete activity.controlGroup;
        delete activity.fixit;
        delete activity.rules;
        //create states for activity
        if (!hubs[hub].ioStates.hasOwnProperty(activityLabel)) {
            adapter.log.info('added new activity: ' + activityLabel);
            adapter.setObject(activityChannelName, {
                type: 'state',
                common: {
                    name: 'activity:' + activityLabel,
                    role: 'switch',
                    type: 'number',
                    write: true,
                    read: true,
                    min: 0,
                    max: 3
                },
                native: activity
            });
        }
        delete hubs[hub].ioStates[activityLabel];
    });

    /* create devices */
    adapter.log.debug('creating devices');
    channelName = hub;
    config.device.forEach(function (device) {
        var deviceLabel = device.label.replace(/[.\s]+/g, '_');
        var deviceChannelName = channelName + '.' + deviceLabel;
        var controlGroup = device.controlGroup;
        hubs[hub].devices[device.id] = deviceLabel;
        hubs[hub].devices_reverse[deviceLabel] = device.id;
        delete device.controlGroup;
        //create channel for device
        if (!hubs[hub].ioChannels.hasOwnProperty(deviceLabel)) {
            adapter.log.info('added new device: ' + deviceLabel);
            adapter.setObject(deviceChannelName, {
                type: 'channel',
                common: {
                    name: deviceLabel,
                    role: 'media.device'
                },
                native: device
            });
            controlGroup.forEach(function (controlGroup) {
                var groupName = controlGroup.name;
                controlGroup.function.forEach(function (command) {
                    command.controlGroup = groupName;
                    command.deviceId = device.id;
                    var commandName = command.name.replace(/[.\s]+/g, '_');
                    //create command
                    adapter.setObject(deviceChannelName + '.' + commandName, {
                        type: 'state',
                        common: {
                            name: deviceLabel + ':' + commandName,
                            role: 'button',
                            type: 'number',
                            write: true,
                            read: true,
                            min: 0
                        },
                        native: command
                    });
                    adapter.setState(deviceChannelName + '.' + commandName, {val: '0', ack: true});
                });
            });
        }
        delete hubs[hub].ioChannels[deviceLabel];
    });

    adapter.log.debug('deleting activities');
    Object.keys(hubs[hub].ioStates).forEach(function (activityLabel) {
        adapter.log.info('removed old activity: ' + activityLabel);
        adapter.deleteState(hub, 'activities', activityLabel);
    });

    adapter.log.debug('deleting devices');
    Object.keys(hubs[hub].ioChannels).forEach(function (deviceLabel) {
        adapter.log.info('removed old device: ' + deviceLabel);
        adapter.deleteChannel(hub, deviceLabel);
    });

    hubs[hub].statesExist = true;
    setBlocked(hub, false);
    setConnected(hub, true);
    hubs[hub].isSync = true;
    adapter.log.info('synced hub config');
}

function processDigest(hub, digest) {
    //set hub activity to current activity label
    setCurrentActivity(hub, digest.activityId);
    //Set hub status to current activity status
    setCurrentStatus(hub, digest.activityStatus);

    if (digest.activityId != '-1') { //if activityId is not powerOff
        //set activityId's status
        setStatusFromActivityID(hub, digest.activityId, digest.activityStatus);

        //if status is 'running' set all other activities to 'off'
        if (digest.activityStatus == '2') {
            //only one activity can run at once, set all other activities to off
            for (var activity in hubs[hub].activities) {
                if (hubs[hub].activities.hasOwnProperty(activity) && activity != digest.activityId) {
                    setStatusFromActivityID(hub, activity, 0);
                }
            }
        }
    } else { //set all activities to 'off' since powerOff activity is active
        for (var oActivity in hubs[hub].activities) {
            if (hubs[hub].activities.hasOwnProperty(oActivity)) {
                setStatusFromActivityID(hub, oActivity, 0);
            }
        }
    }
}

function setCurrentActivity(hub, id) {
    if (!hubs[hub].activities.hasOwnProperty(id)) {
        adapter.log.warn('unknown activityId: ' + id);
        return;
    }
    adapter.log.debug('current activity: ' + hubs[hub].activities[id]);
    adapter.setState(hub + '.activities.currentActivity', {val: hubs[hub].activities[id], ack: true});
}

function setCurrentStatus(hub, status) {
    if (hubs[hub].statesExist)
        adapter.setState(hub + '.activities.currentStatus', {val: status, ack: true});
}

function setStatusFromActivityID(hub, id, value) {
    if (id == '-1') return;
    if (!hubs[hub].activities.hasOwnProperty(id)) {
        adapter.log.warn('unknown activityId: ' + id);
        return;
    }
    var channelName = hub + '.activities.' + hubs[hub].activities[id].replace(/[.\s]+/g, '_');
    adapter.setState(channelName, {val: value, ack: true});
}

function setBlocked(hub, bool) {
    if (hubs[hub] && hubs[hub].statesExist) {
        bool = Boolean(bool);
        adapter.setState(hub + '.hubBlocked', {val: bool, ack: true});
        hubs[hub].blocked = bool;
    }
}

function setConnected(hub, bool) {
    if (hubs[hub] && hubs[hub].statesExist) {
        bool = Boolean(bool);
        adapter.setState(hub + '.hubConnected', {val: bool, ack: true});
    }
}