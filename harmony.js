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

var harmony   = require('harmonyhubjs-client');
var HarmonyHubDiscover = require('harmonyhubjs-discover');
var utils = require(__dirname + '/lib/utils'); // Get common adapter utils
var adapter = utils.adapter('harmony');

adapter.on('stateChange', function (id, state) {
    if (!id || !state || state.ack) {
        return;
    }
    var tmp = id.split('.');
    if (tmp.length == 6){
        var name = tmp.pop();
        var channel = tmp.pop();
        var type = tmp.pop();
        var hub = tmp.pop();
    }else if (tmp.length == 5){
        adapter.log.warn('unknown state change');
        return;
    }else if (tmp.length == 4) {
        var name = tmp.pop();
        var channel;
        var type = 'hub';
        var hub = tmp.pop();
    }else {
        adapter.log.warn('unknown state change');
        return;
    }
    switch (type) {
        case 'activities':
            switch (name) {
                case 'activityStatus':
                    switchActivity(channel,state.val);
                    break;
                case 'status':
                    switchActivity(undefined,0);
                    break;
                default:
                    adapter.log.info('stateChange not implemented (activities)');
                    break;
            }
            break;
        case 'hub':
            switch (name) {
                case 'status':
                    switchActivity(undefined,0);
                    break;
                default:
                    adapter.log.info('stateChange not implemented (hub)');
                    break;
            }
            break;
        case 'devices':
            if (state){
                sendCommand(id);
            }else{
                adapter.setState(id,{val: false, ack: true});
            }
            break;
        default:
            adapter.log.info('stateChange not implemented');
            break;
    }
});

function sendCommand(id){
    adapter.getObject(id,function (err, obj) {
        if (err) {
            adapter.log.warn('cannot send command, unknown state');
            adapter.setState(id,{val: false, ack: true});
            return;
        }
        if (!client){
            adapter.log.warn('error sending command, client offline');
            adapter.setState(id,{val: false, ack: true});
            return;
        }
        var encodedAction = obj.native.action.replace(/\:/g, '::');
        client.send('holdAction', 'action=' + encodedAction + ':status=press');
        //release after 50ms
        setTimeout(function(){client.send('holdAction', 'action=' + encodedAction + ':status=release');adapter.setState(id,{val: false, ack: true});},50)
    });
}

function switchActivity(activityLabel,value) {
    if (!client){
        adapter.log.warn('error changing activity, client offline');
        return;
    }
    //get current Activity
    value = parseInt(value);
    if (isNaN(value)) value = 1;
    if (value == 0){
        client.turnOff();
    }else if(activities_reverse.hasOwnProperty(activityLabel)){
        client.startActivity(activities_reverse[activityLabel]);
    }else{
        adapter.log.warn('activityLabel does not exists');
    }
}

// New message arrived. obj is array with current messages
adapter.on('message', function (obj) {
    var wait = false;
    if (obj) {
        switch (obj.command) {
            case 'browse':
                adapter.log.info('got browse');
                browse(obj.message,function(res) {
                    if (obj.callback) adapter.sendTo(obj.from, obj.command, JSON.stringify(res), obj.callback);
                });
                wait = true;
                break;
            default:
                adapter.log.warn("Unknown command: " + obj.command);
                break;
        }
    }
    if (!wait && obj.callback) {
        adapter.sendTo(obj.from, obj.command, obj.message, obj.callback);
    }
    return true;
});

adapter.on('unload', function (callback) {
    try {
        adapter.log.info('terminating');
        discoverStop();
    } catch (e) {
        adapter.log.warn(e);
    } finally {
        callback();
    }
});

adapter.on('ready', function () {
    main();
});

function browse(timeout, callback) {
    timeout = parseInt(timeout);
    if (isNaN(timeout)) timeout = 5000;
    if (!discover){
        callback({error:1,message:'discover not active, see logs.'})
    }else {
        setTimeout(function(){
            var hubs = Object.keys(discover.knownHubs).map(function(hubUuid) {
                return discover.knownHubs[hubUuid];
            });
            callback({error:0, message: hubs});
        },timeout);
    }
}

var client;
var discover;
var activities = {};
var activities_reverse = {};
var devices = {};
var devices_reverse = {};
var currentActivity;

function main() {
    adapter.subscribeStates(adapter.config.hub.replace(/\s/g,'_') + '*');
    discoverStart();
}

function discoverStart() {
    if (discover){
        return;
    }
    try {
        discover = new HarmonyHubDiscover(61991);
        discover.on('online', function(hub) {
            // Triggered when a new hub was found
            adapter.log.info('discovered ' + hub.host_name);
            if (hub.host_name == adapter.config.hub){
                connect(hub);
            }
        });
        discover.on('offline', function(hub) {
            // Triggered when a hub disappeared
            adapter.log.info('lost ' + hub.host_name);
            adapter.setState(adapter.config.hub.replace(/\s/g,'_') + '.connected', {val: false, ack: true});
            if (client) client.end();
            client = null;
        });
        discover.start();
    } catch (e) {
        adapter.log.error('could not start discover: ' + e);
        discover.stop();
        adapter.stop();
    }
}

function discoverRestart() {
    adapter.setState(adapter.config.hub.replace(/\s/g,'_') + '.connected', {val: false, ack: true});
    discoverStop();
    setTimeout('discoverStart',1000);
}

function discoverStop() {
    if (discover){
        try{
            discover.stop();
            adapter.log.info('stopped hub discovery');
        }catch (e) {
            adapter.log.warn('could not stop discover: ' + e);
        }
    }
    discover = null;
    try{
        if (client) client.end();
    } catch (e) {
        adapter.log.warn('could not end client: ' + e);
    }
    client = null;
}

function connect(hub){
    adapter.log.info('connecting to ' + hub.host_name);
    try {
        harmony(hub.ip).timeout(5000).then(function(harmonyClient) {
            adapter.log.info('connected to ' + hub.host_name);
            adapter.setState(adapter.config.hub.replace(/\s/g,'_') + '.connected', {val: true, ack: true});
            client = harmonyClient;

            /*
            harmonyClient._xmppClient.connection.socket.on('connect', function() {
                adapter.log.info('socket connect');
            });
            harmonyClient._xmppClient.connection.socket.on('timeout', function() {
                adapter.log.info('socket timeout');
            });
            harmonyClient._xmppClient.connection.socket.on('close', function(e) {
                adapter.log.info('socket closed');
            });
            harmonyClient._xmppClient.connection.socket.on('end', function(e) {
                adapter.log.info('socket ended');
            });
            harmonyClient._xmppClient.connection.socket.on('error', function(e) {
                adapter.log.error('socket error: ' + JSON.stringify(e));
            });
            harmonyClient._xmppClient.connection.socket.on('connect', function() {
                adapter.log.info('socket connect');
            });
            harmonyClient._xmppClient.on('error', function(e) {
                adapter.log.error('xmpp error: ' + JSON.stringify(e));
            });
            harmonyClient._xmppClient.on('offline', function() {
                adapter.log.info('xmpp offline');
            });
            harmonyClient._xmppClient.on('online', function(jid) {
                adapter.log.info('xmpp online');
            });
            */
            ! function keepAlive(){
                harmonyClient.request('getCurrentActivity').timeout(5000).then(function(response) {
                    setTimeout(keepAlive, 10000);
                }).catch(function(e){
                    adapter.log.warn('keep alive cannot get current Activity: ' + e);
                });
            }();

            //update objects on connect
            harmonyClient.getAvailableCommands().then(function(config) {
                processConfig(hub,config);
                //set current activity
                harmonyClient.request('getCurrentActivity').timeout(5000).then(function(response) {
                    if (response.hasOwnProperty('result')){
                        //set hub.activity to activity label
                        setCurrentActivity(response.result);
                        //set activity.status and hub.status
                        if(response.result != '-1'){
                            setStatusFromActivityID(response.result,2);
                            adapter.setState(adapter.config.hub.replace(/\s/g,'_') + '.status', {val: 2, ack: true});
                        }else {
                            adapter.setState(adapter.config.hub.replace(/\s/g,'_') + '.status', {val: 0, ack: true});
                        }
                        //set all other activities to 'off'
                        for (var activity in activities){
                            if (activity != response.result){
                                setStatusFromActivityID(activity,0);
                            }
                        }
                    }
                }).catch(function(e){
                    adapter.log.warn('connection down: ' + e);
                    discoverRestart();
                });

                //listen for updates from hub
                harmonyClient.on('stateDigest', function(digest) {
                    processDigest(digest);
                });
            });
        }).catch(function(e){
            adapter.log.warn('could not connect to ' + hub.host_name + ': ' + e);
            discoverRestart();
        });
    } catch (e) {
        adapter.log.warn('could not connect to ' + hub.host_name + ': ' + e);
        discoverRestart();
    }
}

function processConfig(hub,config) {
    /* create hub */
    adapter.log.info('creating/updating hub device');
    adapter.setObject(adapter.config.hub.replace(/\s/g,'_'), {
        type: 'device',
        common: {
            name: adapter.config.hub.replace(/\s/g,'_')
        },
        native: hub
    });
    adapter.setObject(adapter.config.hub.replace(/\s/g,'_') + '.connected', {
        type: 'state',
        common: {
            name: adapter.config.hub.replace(/\s/g,'_') + '.connected',
            role: 'indicator.connected',
            type: 'boolean',
            write: false,
            read: true
        },
        native: {
        }
    });
    adapter.setObject(adapter.config.hub.replace(/\s/g,'_') + '.activity', {
        type: 'state',
        common: {
            name: adapter.config.hub.replace(/\s/g,'_') + '.activity',
            role: 'indicator.activity',
            type: 'string',
            write: false,
            read: true
        },
        native: {
        }
    });
    adapter.setObject(adapter.config.hub.replace(/\s/g,'_') + '.status', {
        type: 'state',
        common: {
            name: adapter.config.hub.replace(/\s/g,'_') + '.status',
            role: 'switch',
            type: 'number',
            write: true,
            read: true,
            min: 0,
            max: 3
        },
        native: {
        }
    });

    /* create activities */
    adapter.log.info('creating/updating activities');
    var channelName = adapter.config.hub.replace(/\s/g,'_') + '.activities';
    //create channel for activities
    adapter.setObject(channelName , {
        type: 'channel',
        common: {
            name: 'activities',
            role: 'channel.activities'
        },
        native: {
        }
    });
    config.activity.forEach(function(activity) {
        activities[activity.id] = activity.label;
        activities_reverse[activity.label] = activity.id;
        if (activity.id == '-1') return;
        //create activities
        var activityChannelName = channelName + '.' + activity.label.replace(/\s/g,'_');
        //create channel for activity
        delete activity.sequences;
        delete activity.controlGroup;
        delete activity.fixit;
        delete activity.rules;
        adapter.setObject(activityChannelName , {
            type: 'channel',
            common: {
                name: 'activities.' + activity.label,
                role: 'media.activity'
            },
            native: activity
        });
        //create states for activity
        adapter.setObject(activityChannelName + '.activityStatus', {
            type: 'state',
            common: {
                name: 'activities.' + activity.label + '.activityStatus',
                role: 'switch',
                type: 'number',
                write: true,
                read: true,
                min: 0,
                max: 3
            },
            native: {
                id: activity.id
            }
        });
    });

    /* create devices */
    adapter.log.info('creating/updating devices');
    var channelName = adapter.config.hub.replace(/\s/g,'_') + '.devices';
    //create channel for activities
    adapter.setObject(channelName , {
        type: 'channel',
        common: {
            name: 'devices',
            role: 'channel.devices'
        },
        native: {
        }
    });
    config.device.forEach(function(device) {
        devices[device.id] = device.label;
        devices_reverse[device.label] = device.id;
        var deviceChannelName = channelName + '.' + device.label.replace(/\s/g,'_');
        var controlGroup = device.controlGroup;
        delete device.controlGroup;
        //create channel for device
        adapter.setObject(deviceChannelName , {
            type: 'channel',
            common: {
                name: 'devices.' + device.label,
                role: 'media.device'
            },
            native: device
        });
        controlGroup.forEach(function(controlGroup){
            var groupName = controlGroup.name;
            controlGroup.function.forEach(function(command) {
                command['controlGroup'] = groupName;
                command['deviceId'] = device.id;
                //create command
                adapter.setObject(deviceChannelName + '.' + command.name.replace(/\./g,'__'), {
                    type: 'state',
                    common: {
                        name: 'devices.' + device.label + '.' + command.name.replace(/\./g,'__'),
                        role: 'button',
                        type: 'boolean',
                        write: true,
                        read: true
                    },
                    native: command
                });
                adapter.setState(deviceChannelName + '.' + command.name.replace(/\./g,'__'), {val: false, ack: true});
            });
        });
    });

    adapter.log.info('init ready');
}

function processDigest(digest){
    adapter.log.info('stateDigest: ' + JSON.stringify(digest));
    //set hub.activity to current activity label
    setCurrentActivity(digest.activityId);
    //Set hub.status to current activity status
    adapter.setState(adapter.config.hub.replace(/\s/g,'_') + '.status', {val: digest.activityStatus, ack: true});

    if (digest.activityId != '-1'){ //if activityId is not powerOff
        //set activityId's status
        setStatusFromActivityID(digest.activityId,digest.activityStatus);

        //if status is 'running' set all other activities to 'off'
        if (digest.activityStatus == '2'){
            //only one activity can run at once, set all other activities to off
            for (var activity in activities){
                if (activity != digest.activityId){
                    setStatusFromActivityID(activity,0);
                }
            }
        }
    }else { //set all activities to 'off' since powerOff activity is active
        for (var activity in activities){
            setStatusFromActivityID(activity,0);
        }
    }
}

function setCurrentActivity(id){
    if (!activities.hasOwnProperty(id)){
        adapter.log.warn('unknown activityId: ' + id);
        return;
    }
    adapter.setState(adapter.config.hub.replace(/\s/g,'_') + '.activity', {val: activities[id], ack: true});
    currentActivity = id;
}

function setStatusFromActivityID(id,value){
    if (id == '-1') return;
    if (!activities.hasOwnProperty(id)){
        adapter.log.warn('unknown activityId: ' + id);
        return;
    }
    var channelName = adapter.config.hub.replace(/\s/g,'_') + '.activities.' + activities[id].replace(/\s/g,'_') + '.activityStatus';
    adapter.setState(channelName,{val: value, ack: true});
}


function cleanDevices() {
 //@todo
}


