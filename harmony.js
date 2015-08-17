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
var semaphore = require('semaphore')(1);
var utils = require(__dirname + '/lib/utils'); // Get common adapter utils
var adapter = utils.adapter('harmony');

//fix discover stop
HarmonyHubDiscover.prototype.stop = function stop() {
    this.ping.stop();
    if(this.responseCollector.server) {
        this.responseCollector.server.close();
    }
    clearInterval(this.cleanUpIntervalToken);
};

adapter.on('stateChange', function (id, state) {
    if (!id || !state || state.ack) {
        return;
    }
    if (semaphore.current > 0){
        adapter.log.info('hub busy, stateChange delayed: ' + id + '=' + state.val);
    }
    semaphore.take(function() {
        setBlocked(true);
        processStateChange(id,state,function(){
            if (semaphore.current == 1){
                setBlocked(false);
            }
            semaphore.leave();
        });
    });
});

function processStateChange(id,state,callback){
    var tmp = id.split('.');
    if (tmp.length == 5){
        var name = tmp.pop();
        var channel = tmp.pop();
    }else {
        adapter.log.warn('unknown state change');
        return;
    }
    switch (channel){
        case 'activities':
            switch (name){
                case 'currentStatus':
                    switchActivity(undefined,0,callback);
                    break;
                case 'currentActivity':
                    adapter.log.warn('stateChange not implemented (currentActivity)');
                    break;
                default:
                    switchActivity(name,state.val,callback);
                    break;
            }
            break;
        default:
            adapter.log.debug('sending command: ' + channel + ':' + name);
            if (state.val){
                var ms = parseInt(state.val);
                if (isNaN(ms) || ms < 100){
                    ms = 100;
                }
                sendCommand(id,ms,callback);
            }else{
                adapter.setState(id,{val: 0, ack: true});
                callback();
            }
            break;
    }
}

function sendCommand(id,ms,callback){
    adapter.getObject(id,function (err, obj) {
        if (err) {
            adapter.log.warn('cannot send command, unknown state');
            adapter.setState(id,{val: 0, ack: true});
            callback();
            return;
        }
        if (!client){
            adapter.log.warn('error sending command, client offline');
            adapter.setState(id,{val: 0, ack: true});
            callback();
            return;
        }
        adapter.log.debug('sending command: ' + obj.name);
        var encodedAction = obj.native.action.replace(/\:/g, '::');

        var tsStart = Date.now();
        var first = true;
        ! function repeat(){
            var tsNow = Date.now();
            if (tsNow - tsStart + 250 <= ms || first){
                client.send('holdAction', 'status=press:timestamp=' + (tsNow-timestamp) + ':action=' + encodedAction);
                first = false;
                setTimeout(repeat,200);
            }else{
                setTimeout(function(){
                    client.send('holdAction', ':status=release:timestamp=' + (tsNow-timestamp) + ':action=' + encodedAction);
                    adapter.setState(id,{val: 0, ack: true});
                    callback();
                },Math.max(0,ms-tsNow+tsStart));
            }
        }();
    });
}

function switchActivity(activityLabel,value,callback) {
    if (!client){
        adapter.log.warn('error changing activity, client offline');
        callback();
        return;
    }
    //get current Activity
    value = parseInt(value);
    if (isNaN(value)) value = 1;
    if (value == 0){
        adapter.log.debug('turning activity off');
        client.turnOff().finally(callback);
    }else if(activities_reverse.hasOwnProperty(activityLabel)){
        adapter.log.debug('switching activity to: ' + activityLabel);
        client.startActivity(activities_reverse[activityLabel]).finally(callback)
    }else{
        adapter.log.warn('activity does not exists');
        callback();
    }
}

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
    adapter.log.info('terminating');
    discoverStop();
    callback();
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
var hubName;
var blocked = true;
var timestamp;

function main() {
    hubName = adapter.config.hub.replace(/[.\s]+/g,'_');
    adapter.subscribeStates('*');
    setBlocked(true);
    discoverStart();
}

function discoverStart() {
    if (discover){
        return;
    }
    discover = new HarmonyHubDiscover(61991);
    discover.on('online', function(hub) {
        // Triggered when a new hub was found
        adapter.log.info('discovered ' + hub.host_name);
        if (hub.host_name == adapter.config.hub){
            //wait 1 second for hub before connecting
            setTimeout(function(){connect(hub);},1000);
        }
    });
    discover.on('offline', function(hub) {
        // Triggered when a hub disappeared
        adapter.log.warn('lost ' + hub.host_name);
        discoverRestart();
    });
    discover.on('error', function(er) {
        adapter.log.warn('discover error: ', er.message);
    });
    discover.start();
    adapter.log.debug('discover started');
}

function discoverRestart() {
    adapter.setState(hubName + '.connected', {val: false, ack: true});
    discoverStop();
    setTimeout(function(){discoverStart();},1000);
}

function discoverStop() {
    adapter.setState(hubName + '.connected', {val: false, ack: true});
    if (discover){
        discover.stop();
        adapter.log.debug('discover ended');
    }
    discover = null;
    if (client){
        client.end();
        adapter.log.debug('client ended');
    }
    client = null;
}

function connect(hub){
    harmony(hub.ip).timeout(5000).then(function(harmonyClient) {
        timestamp = Date.now();
        adapter.log.info('connected to ' + hub.host_name);
        adapter.setState(hubName + '.connected', {val: true, ack: true});
        client = harmonyClient;
        //fix harmony client startactivity
        client.startActivity = function startActivity(activityId) {
            var timestamp_temp = Date.now() - timestamp;
            var body = 'activityId=' + activityId + ':timestamp=' + timestamp_temp;

            return this.request('startactivity', body, 'encoded', function(stanza) {
                var event = stanza.getChild('event')
                    , canHandleStanza = false;

                if(event && event.attr('type') === 'connect.stateDigest?notify') {
                    var digest = JSON.parse(event.getText());
                    if (activityId === '-1' && digest.activityId === activityId && digest.activityStatus == 0){
                        canHandleStanza = true;
                    }else if(activityId !== '-1' && digest.activityId === activityId && digest.activityStatus == 2) {
                        canHandleStanza = true;
                    }
                }

                return canHandleStanza;
            });
        };

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
            try{
                processConfig(hub,config);
            }catch (e){
                adapter.log.error(e);
                discoverRestart();
                return;
            }

            //set current activity
            harmonyClient.request('getCurrentActivity').timeout(5000).then(function(response) {
                if (response.hasOwnProperty('result')){
                    //set hub.activity to activity label
                    setCurrentActivity(response.result);
                    //set activity.status and hub.status
                    if(response.result != '-1'){
                        setStatusFromActivityID(response.result,2);
                        setCurrentStatus(2);
                    }else {
                        setCurrentStatus(0);
                    }
                    //set all other activities to 'off'
                    for (var activity in activities){
                        if (activity != response.result){
                            setStatusFromActivityID(activity,0);
                        }
                    }
                }

                //start listen for updates from hub
                harmonyClient.on('stateDigest', function(digest) {
                    processDigest(digest);
                });
            }).catch(function(e){
                adapter.log.warn('connection down: ' + e);
                discoverRestart();
            });
        }).catch(function(e){
            adapter.log.warn('could not get config: ' + e);
            discoverRestart();
        });
    }).catch(function(e){
        adapter.log.warn('could not connect to ' + hub.host_name + ': ' + e);
        discoverRestart();
    });

}

function processConfig(hub,config) {
    /* create hub */
    adapter.log.info('creating activities and devices');
    adapter.log.debug('creating/updating hub device');
    adapter.setObject(hubName, {
        type: 'device',
        common: {
            name: hubName
        },
        native: hub
    });
    adapter.setObject(hubName + '.connected', {
        type: 'state',
        common: {
            name: hubName + ':connected',
            role: 'indicator.connected',
            type: 'boolean',
            write: false,
            read: true
        },
        native: {
        }
    });
    adapter.setObject(hubName + '.blocked', {
        type: 'state',
        common: {
            name: hubName + ':blocked',
            role: 'indicator.blocked',
            type: 'boolean',
            write: false,
            read: true
        },
        native: {
        }
    });

    /* create activities */
    adapter.log.debug('creating/updating activities');
    var channelName = hubName + '.activities';
    //create channel for activities
    adapter.setObject(channelName , {
        type: 'channel',
        common: {
            name: 'activities',
            role: 'media.activities'
        },
        native: {
        }
    });
    adapter.setObject(channelName + '.currentActivity', {
        type: 'state',
        common: {
            name: 'activity:currentActivity',
            role: 'indicator.activity',
            type: 'string',
            write: true,
            read: true
        },
        native: {
        }
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
        native: {
        }
    });
    config.activity.forEach(function(activity) {
        var activityLabel = activity.label.replace(/[.\s]+/g,'_')
        activities[activity.id] = activityLabel;
        activities_reverse[activityLabel] = activity.id;
        if (activity.id == '-1') return;
        //create activities
        var activityChannelName = channelName + '.' + activityLabel;
        //create channel for activity
        delete activity.sequences;
        delete activity.controlGroup;
        delete activity.fixit;
        delete activity.rules;
        //create states for activity
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
    });

    /* create devices */
    adapter.log.debug('creating/updating devices');
    var channelName = hubName;
    config.device.forEach(function(device) {
        var deviceLabel = device.label.replace(/[.\s]+/g,'_');
        var deviceChannelName = channelName + '.' + deviceLabel;
        var controlGroup = device.controlGroup;
        devices[device.id] = deviceLabel;
        devices_reverse[deviceLabel] = device.id;
        delete device.controlGroup;
        //create channel for device
        adapter.setObject(deviceChannelName , {
            type: 'channel',
            common: {
                name: deviceLabel,
                role: 'media.device'
            },
            native: device
        });
        controlGroup.forEach(function(controlGroup){
            var groupName = controlGroup.name;
            controlGroup.function.forEach(function(command) {
                command['controlGroup'] = groupName;
                command['deviceId'] = device.id;
                var commandName = command.name.replace(/[.\s]+/g,'_');
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
    });

    setBlocked(false);
    adapter.log.info('init ready');

    //delete old devices
    adapter.getChannelsOf(hubName,function (err, channels) {
        channels.forEach(function(channel){
            if (channel.common.name == 'activities'){
                return;
            }
            if (!devices.hasOwnProperty(channel.native.id)){
                adapter.log.info('deleting old device: ' + channel.common.name);
                adapter.deleteChannel(hubName,channel.common.name);
            }
        });
    });

    //delete old activities
    adapter.getStates(hubName + '.activities.*',function (err, states) {
        for (var state in states){
            var tmp = state.split('.');
            var name = tmp.pop();
            var channel = tmp.pop();
            var hub = tmp.pop();
            if (name == 'currentStatus' || name == 'currentActivity') return;
            if (!activities_reverse.hasOwnProperty(name)){
                adapter.log.info('deleting old activity: ' + state);
                adapter.deleteState(hub,'activities',name);
            }
        }
    });
}

function processDigest(digest){
    //set hub activity to current activity label
    setCurrentActivity(digest.activityId);
    //Set hub status to current activity status
    setCurrentStatus(digest.activityStatus)

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
    adapter.log.debug('current activity: ' + activities[id]);
    adapter.setState(hubName + '.activities.currentActivity', {val: activities[id], ack: true});
}

function setCurrentStatus(status){
    adapter.setState(hubName + '.activities.currentStatus', {val: status, ack: true});
}

function setStatusFromActivityID(id,value){
    if (id == '-1') return;
    if (!activities.hasOwnProperty(id)){
        adapter.log.warn('unknown activityId: ' + id);
        return;
    }
    var channelName = hubName + '.activities.' + activities[id].replace(/[.\s]+/g,'_');
    adapter.setState(channelName,{val: value, ack: true});
}

function setBlocked(bool){
    if (bool) blocked = true;
    else blocked = false;
    adapter.setState(hubName + '.blocked', {val: blocked, ack: true});
}


