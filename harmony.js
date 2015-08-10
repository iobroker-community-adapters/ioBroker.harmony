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
    adapter.log.debug('stateChange ' + id + ' ' + JSON.stringify(state));
});

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

function main() {
    adapter.subscribeStates('*');
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
                    adapter.log.warn('keep Alive cannot get current Activity: ' + e);
                });
            }();

            //update objects on connect
            harmonyClient.getAvailableCommands().then(function(config) {
                processConfig(hub,config);
                //set current activity
                harmonyClient.request('getCurrentActivity').timeout(5000).then(function(response) {
                    if (response.hasOwnProperty('result')){
                        //set hub.activity to activity label
                        adapter.setState(adapter.config.hub.replace(/\s/g,'_') + '.activity', {val: activities[response.result], ack: true});
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
    // create device
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
            role: 'indicator.status',
            type: 'number',
            write: false,
            read: true,
            min: 0,
            max: 3
        },
        native: {
        }
    });

    adapter.log.info('creating/updating activities');
    config.activity.forEach(function(activity) {
        activities[activity.id] = activity.label;
        if (activity.id == '-1') return;
        //create activities
        var channelName = adapter.config.hub.replace(/\s/g,'_') + '.' + activity.label.replace(/\s/g,'_');
        //create channel for activity
        adapter.setObject(channelName , {
            type: 'channel',
            common: {
                name: channelName,
                role: 'media.activity'
            },
            native: {
                label: activity.label,
                id: activity.id
            }
        });
        //create states for activity
        adapter.setObject(channelName + '.status', {
            type: 'state',
            common: {
                name: channelName + '.status',
                role: 'switch',
                type: 'number',
                write: false,
                read: true,
                min: 0,
                max: 3
            },
            native: {
                id: activity.id
            }
        });
    });
    adapter.log.info('init ready');
}

function setStatusFromActivityID(id,value){
    if (id == '-1') return;
    if (!activities.hasOwnProperty(id)) return;
    var channelName = adapter.config.hub.replace(/\s/g,'_') + '.' + activities[id].replace(/\s/g,'_') + '.status';
    adapter.setState(channelName,{val: value, ack: true});
}

function processDigest(digest){
    adapter.log.info('stateDigest: ' + JSON.stringify(digest));
    //set hub.activity to current activity label
    adapter.setState(adapter.config.hub.replace(/\s/g,'_') + '.activity', {val: activities[digest.activityId], ack: true});
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

function cleanDevices() {
 //@todo
}


