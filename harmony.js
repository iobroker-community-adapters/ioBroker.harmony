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
        if (client) client.end();
    } catch (e) {
        adapter.log.error(e);
    } finally {
        callback();
    }
});

adapter.on('ready', function () {
    main();
});

function browse(timeout, callback) {

}

var client;
var activities = {};

function main() {
    adapter.subscribeStates('*');
    connect(adapter.config.hub);
}

function connect(hub){
    harmony(hub).timeout(5000).then(function(harmonyClient) {
        adapter.log.info('hub client started');
        adapter.setState(adapter.config.hub.replace(/\./g,'-') + '.connected', {val: true, ack: true});
        client = harmonyClient;
        var firstRun = true;
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

        //listen for messages from hub
        harmonyClient.on('stateDigest', function(digest) {
            processDigest(digest);
        });

        //update objects on connect
        harmonyClient.getAvailableCommands().then(function(config) {
            processConfig(config);
            !function checkConnection(){
                harmonyClient.request('getCurrentActivity').timeout(5000).then(function(response) {
                    if (firstRun && response.hasOwnProperty('result')){
                        adapter.setState(adapter.config.hub.replace(/\./g,'-') + '.activity', {val: activities[response.result], ack: true});
                        if(response.result != '-1'){
                            setStatusFromActivityID(response.result,2);
                            adapter.setState(adapter.config.hub.replace(/\./g,'-') + '.status', {val: 2, ack: true});
                        }else {
                            adapter.setState(adapter.config.hub.replace(/\./g,'-') + '.status', {val: 0, ack: true});
                            for (var activity in activities){
                                setStatusFromActivityID(activity,0);
                            }
                        }
                        firstRun = false;
                    }
                    adapter.setState(adapter.config.hub.replace(/\./g,'-') + '.connected', {val: true, ack: true});
                    setTimeout(checkConnection, 10000);
                }).catch(function(e){
                    adapter.log.warn('connection down: ' + e);
                    client.end();
                    adapter.setState(adapter.config.hub.replace(/\./g,'-') + '.connected', {val: false, ack: true});
                    client = null;
                    setTimeout(connect,5000,hub);
                });
            }();
        });
    }).catch(function(e){
        adapter.log.warn('could not connect to '+hub+': ' + e);
        adapter.setState(adapter.config.hub.replace(/\./g,'-') + '.connected', {val: false, ack: true});
        client = null;
        setTimeout(connect,5000,hub);
    });
}

function processConfig(config) {
    deleteDevices();
    // create device
    adapter.log.info('creating/updating hub device');
    adapter.setObject(adapter.config.hub.replace(/\./g,'-'), {
        type: 'device',
        common: {
            name: adapter.config.hub.replace(/\./g,'-')
        },
        native: {
            ip: adapter.config.hub
        }
    });
    adapter.setObject(adapter.config.hub.replace(/\./g,'-') + '.connected', {
        type: 'state',
        common: {
            name: adapter.config.hub.replace(/\./g,'-') + '.connected',
            role: 'indicator.connected',
            type: 'boolean',
            write: false,
            read: true
        },
        native: {
        }
    });
    adapter.setObject(adapter.config.hub.replace(/\./g,'-') + '.activity', {
        type: 'state',
        common: {
            name: adapter.config.hub.replace(/\./g,'-') + '.activity',
            role: 'indicator.activity',
            type: 'string',
            write: false,
            read: true
        },
        native: {
        }
    });
    adapter.setObject(adapter.config.hub.replace(/\./g,'-') + '.status', {
        type: 'state',
        common: {
            name: adapter.config.hub.replace(/\./g,'-') + '.status',
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
        var channelName = adapter.config.hub.replace(/\./g,'-') + '.' + activity.label.replace(/\s/g,'_');
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
        adapter.setState(channelName + '.status', {val: 0, ack: true});
    });
    adapter.log.info('init ready');
}

function setStatusFromActivityID(id,value){
    if (id == '-1') return;
    if (!activities.hasOwnProperty(id)) return;
    var channelName = adapter.config.hub.replace(/\./g,'-') + '.' + activities[id].replace(/\s/g,'_') + '.status';
    adapter.setState(channelName,{val: value, ack: true});
}

function processDigest(digest){
    adapter.log.info('stateDigest: ' + JSON.stringify(digest));
    adapter.setState(adapter.config.hub.replace(/\./g,'-') + '.activity', {val: activities[digest.activityId], ack: true});
    adapter.setState(adapter.config.hub.replace(/\./g,'-') + '.status', {val: digest.activityStatus, ack: true});
    if (digest.activityId != '-1'){
        setStatusFromActivityID(digest.activityId,digest.activityStatus);
        if (digest.activityStatus == '2'){
            //only one activity can run at once, set all other activities to 0
            for (var activity in activities){
                if (activity != digest.activityId){
                    setStatusFromActivityID(activity,0);
                }
            }
        }
    }else {
        for (var activity in activities){
            setStatusFromActivityID(activity,0);
        }
    }
}

function deleteDevices() {
 //@todo
}


