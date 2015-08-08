/**
 *
 *      ioBroker Philips Hue Bridge Adapter
 *
 *      (c) 2014-2015 hobbyquaker
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
        client.end();
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
    timeout = parseInt(timeout);
    if (isNaN(timeout)) timeout = 5000;
    return;
}

var client;
var activities = {};

function main() {
    adapter.subscribeStates('*');

    harmony('192.168.0.58').then(function(harmonyClient) {
        adapter.log.info('hub client started');
        client = harmonyClient;
        harmonyClient._xmppClient.connection.socket.setTimeout(0);
        harmonyClient._xmppClient.connection.socket.setKeepAlive(true);
        harmonyClient._xmppClient.reconnect = true;
        harmonyClient._xmppClient.connection.reconnect = true;
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
        harmonyClient.on('stateDigest', function(digest) {
            adapter.log.info('stateDigest: ' + JSON.stringify(digest));
        });
        harmonyClient.getActivities().then(function(activities) {
            adapter.log.info(JSON.stringify(activities));
            client.end();
        });
    }).catch(function(e){
        adapter.log.error('error: ' + JSON.stringify(e));
    });

    if (adapter.config.polling && adapter.config.pollingInterval > 0) {
        setTimeout(poll, 5 * 1000);
    }
}

function poll() {
    return;
    setTimeout(poll, adapter.config.pollingInterval * 1000);
}

