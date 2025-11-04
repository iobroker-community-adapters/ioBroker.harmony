![Logo](admin/harmony.png)
# ioBroker.harmony

[![GitHub license](https://img.shields.io/github/license/iobroker-community-adapters/ioBroker.harmony)](https://github.com/iobroker-community-adapters/ioBroker.harmony/blob/master/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/iobroker.harmony.svg)](https://www.npmjs.com/package/iobroker.harmony)
![GitHub repo size](https://img.shields.io/github/repo-size/iobroker-community-adapters/ioBroker.harmony)
[![Translation status](https://weblate.iobroker.net/widgets/adapters/-/harmony/svg-badge.svg)](https://weblate.iobroker.net/engage/adapters/?utm_source=widget)

![GitHub commit activity](https://img.shields.io/github/commit-activity/m/iobroker-community-adapters/ioBroker.harmony)
![GitHub commits since latest release (by date)](https://img.shields.io/github/commits-since/iobroker-community-adapters/ioBroker.harmony/latest)
![GitHub last commit](https://img.shields.io/github/last-commit/iobroker-community-adapters/ioBroker.harmony)
![GitHub issues](https://img.shields.io/github/issues/iobroker-community-adapters/ioBroker.harmony)

**Version:**

[![NPM version](http://img.shields.io/npm/v/iobroker.harmony.svg)](https://www.npmjs.com/package/iobroker.harmony)
![Current version in stable repository](https://iobroker.live/badges/harmony-stable.svg)
![Number of Installations](https://iobroker.live/badges/harmony-installed.svg)

**Tests:**

[![Test and Release](https://github.com/iobroker-community-adapters/ioBroker.harmony/actions/workflows/test-and-release.yml/badge.svg)](https://github.com/iobroker-community-adapters/ioBroker.harmony/actions/workflows/test-and-release.yml)
[![CodeQL](https://github.com/iobroker-community-adapters/ioBroker.harmony/actions/workflows/codeql.yml/badge.svg)](https://github.com/iobroker-community-adapters/ioBroker.harmony/actions/workflows/codeql.yml)

<!--
## Sentry
**This adapter uses Sentry libraries to automatically report exceptions and code errors to the developers.**
For more details and for information how to disable the error reporting see [Sentry-Plugin Documentation](https://github.com/ioBroker/plugin-sentry#plugin-sentry)! Sentry reporting is used starting with js-controller 3.0.
-->

## ioBroker Logitech Harmony Adapter

Control your harmony activities from ioBroker.

## Install
Install Harmony via ioBroker Admin.
Adapter should automatically find your Hubs.

If the hub and iobroker are in the different subnets, the broadcasts will not work (#147).
The workaround is to add the hub IP as subnet IP but this only works for one hub,
e.g. setting the subnet(s) to (`192.168.178.5,192.168.178.6`) in admin will allow discovery for both hubs.

## Usage

### Activities
#### Start
Set the status state `Instance.Hub_Name.activities.Activity_Name` to a Number greater than 0.
During the activity's startup sequence, the status changes from 1 (startup) to 2(running)

#### Stop
Set the state `Instance.Hub_Name.activities.Activity_Name` to 0.
Alternatively, you can set the hub's status `Instance.activities.currentStatus` to any number.
During the activity's exit sequence, the status changes from 3 (stopping) to 0 (stopped)

### Indicators
There are two indicators `Instance.Hub_Name.activity` and `Instance.Hub_Name.connected`.
Both are read-only, changing their values has no effect.

* `.hubConnected` - Tells you whether the adapter is successfully connected to the hub.
* `.hubBlocked` - Is set to true if Hub is busy starting/stopping activities or sending commands.
* `activities.currentActivity` - Gives you the name of the currently running activity.
* `activities.currentStatus` - Gives you the current status of the hub. 
  - 0 = inactive
  - 1 = starting
  - 2 = active
  - 3 = stopping
- `activities.<activity name\>` - Status of this activity. Values are the same as above.

### Devices
#### Send Command  
Set `Instance.Hub_Name.Device_Name.command` to a number X to send command for X milliseconds.
A value smaller than 250 probably will send the command only once.
After sending, the state will be set to 0 again.

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->
### 2.0.3 (2025-11-04)
* (@GermanBluefox) Corrected the table in the configuration

### 2.0.2 (2025-11-03)
* (mcm1957) Adapter requires node.js >= 20, js-controller >= 6.0.11 and admin >= 7.6.17 now.
* (@GermanBluefox) Added state "switch" to switch activities on/off with Alexa
* (@GermanBluefox) Adapter has been rewritten with TypeScript
* (mcm1957) Dependencies have been updated.

### 1.5.0 (2024-06-02)
* (WolfspiritM) Multiple subnets can be entered as comma separated list now. (#147)
* (mcm1957) Testing for node.js 22 has been added.
* (mcm1957) Dependencies have been updated.

### 1.4.0 (2024-04-11)
* (mcm1957) Adapter requires node.js 18 and js-controller >= 5 now
* (mcm1957) Translations have been updated
* (mcm1957) Dependencies have been updated

### 1.3.0 (2023-11-08)
* (mcm1957) Adapter requires nodejs 16 now.
* (mcm1957) Adapter has been moved to iobroker-community-adapters organisation.
* (mcm1957) Dependencies have been updated.

### License
The MIT License (MIT)

Copyright (c) 2023-2025 iobroker-community-adapters <iobroker-community-adapters@gmx.de>  
Copyright (c) 2015-2019 Pmant <patrickmo@gmx.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
