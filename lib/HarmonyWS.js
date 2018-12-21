// Logitech Harmony Class using websocket instead of old (removed) api
// Credit for finding/sharing knowledge about the api goes to:
//	https://github.com/jlynch630/Harmony.NET
//	https://github.com/chadcb/harmonyhub
//
//  ported to node.js from https://github.com/d-EScape/HarmonyApi
//  by: https://github.com/Pmant

'use strict';

function _asyncToGenerator(fn) { return function () { const gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step('next', value); }, function (err) { step('throw', err); }); } } return step('next'); }); }; }

const ws = require('ws');
const rp = require('request-promise-native');
const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 1000;

class HarmonyWS extends EventEmitter {
    constructor(ip, port) {
        super();
        this.ip = ip;
        this.port = port || 8088;
        this.url = 'http://' + this.ip + ':' + this.port;
        this.requestId = 0;
        this.status = 0;
        this.timeout = 30;
        this.pingTime = 30000;
        this.domain = 'svcs.myharmony.com';
        this.init();
        //watchdog
        setInterval(() => {
            if (this.status === 0) {
                if (this.ws) {
                    try {
                        this.ws.close();
                    } catch (e) {
                        this.emit('error');
                    }
                    delete this.ws;
                }
                this.init();
            }
        }, 30000);
    }

    close() {
        if (this.ws) {
            this.ws.close();
            delete this.ws;
        }
    }

    init() {
        const _this = this;

        return _asyncToGenerator(function* () {
            try {
                _this.status = 1;
                _this.hubId = yield _this.getHubId();
                const wsUrl = 'ws://' + _this.ip + ':' + _this.port + '?domain=' + _this.domain + '&hubId=' + _this.hubId;
                const socket = new ws(wsUrl);
                socket.on('open', function () {
                    _this.status = 2;
                    setTimeout(function () {
                        _this.requestState();
                    }, 1000);
                    _this.pingInterval = setInterval(function () {
                        _this.ws.ping();
                    }, _this.pingTime);
                });
                socket.on('message', function (data) {
                    _this.parseMessage(data);
                });
                socket.on('close', function () {
                    _this.emit('offline');
                    _this.status = 0;
                    clearInterval(_this.pingInterval);
                });
                _this.ws = socket;
            } catch (e) {
                _this.emit('error', 'could not connect to hub', _this.ip);
                _this.status = 0;
            }
        })();
    }

    parseMessage(data) {
        try {
            data = JSON.parse(data);
        } catch (e) {
            this.emit('error');
        }

        if (data.cmd || data.type) {
            const cmdType = data.cmd || data.type;
            switch (cmdType) {
                case 'connect.stateDigest?notify':
                case 'vnd.logitech.connect/vnd.logitech.statedigest?get':
                    if (this.status === 2) {
                        this.status = 3;
                        this.emit('online', this.hubId);
                    }
                    this.emit('status', data.data.activityId, data.data.activityStatus);
                    break;
                case 'vnd.logitech.harmony/vnd.logitech.harmony.engine?config':
                    this.emit('config', data.data);
                    break;
                default:
                    break;
            }
        }
    }

    getHubId() {
        const _this2 = this;

        return _asyncToGenerator(function* () {
            const options = {
                method: 'POST',
                uri: _this2.url,
                body: {
                    'id': 'hws' + _this2.requestId++,
                    'cmd': 'connect.discoveryinfo?get',
                    'params': {}
                },
                headers: {
                    'Content-type': 'application/json',
                    'Accept': 'text/plain',
                    'Origin': 'http//:localhost.nebula.myharmony.com'
                },
                json: true // Automatically stringifies the body to JSON
            };
            try {
                const response = yield rp(options);
                _this2.domain = response.data.discoveryServerUri.split('/')[2];
                return response.data.remoteId;
            } catch (e) {
                throw e;
            }
        })();
    }

    requestActivityChange(activityId) {
        const _this3 = this;

        return _asyncToGenerator(function* () {
            const options = {
                method: 'POST',
                uri: _this3.url,
                body: {
                    'cmd': 'harmony.activityengine?runactivity',
                    'params': {
                        'activityId': activityId
                    }
                },
                headers: {
                    'Content-type': 'application/json',
                    'Accept': 'text/plain',
                    'Origin': 'http//:localhost.nebula.myharmony.com'
                },
                json: true // Automatically stringifies the body to JSON
            };
            yield rp(options);
        })();
    }

    requestState() {
        const payload = {
            //hubId: this.hubId;
            timeout: this.timeout,
            hbus: {
                cmd: 'vnd.logitech.connect/vnd.logitech.statedigest?get',
                id: 'hws' + this.requestId++,
                params: { 'verb': 'get', 'format': 'json' }
            }
        };
        this.send(payload);
    }

    requestConfig() {
        const payload = {
            //hubId: this.hubId;
            timeout: this.timeout,
            hbus: {
                cmd: 'vnd.logitech.harmony/vnd.logitech.harmony.engine?config',
                id: 'hws' + this.requestId++,
                params: { 'verb': 'get' }
            }
        };
        this.send(payload);
    }

    requestKeyPress(deviceId, keyId, type = 'IRCommand', hold = 'press') {
        let action = {};
        if (typeof deviceId === 'string') {
            action = deviceId;
            hold = keyId || 'press';
        } else {
            action = JSON.stringify({
                deviceId: deviceId,
                command: keyId,
                type: type
            });
        }
        const payload = {
            //hubId: this.hubId;
            timeout: this.timeout,
            hbus: {
                cmd: 'vnd.logitech.harmony/vnd.logitech.harmony.engine?holdAction',
                id: 'hws' + this.requestId++,
                params: {
                    action: action,
                    timestamp: '0',
                    status: hold
                }
            }
        };
        this.send(payload);
    }

    send(data) {
        if (this.ws && this.status >= 2) this.ws.send(JSON.stringify(data));
    }
}

module.exports = HarmonyWS;