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
The adapter should find your hubs automatically.

If no hub is found, the instance settings offer two knobs:

* **Network interface** — the interface the adapter searches on. Pick one on hosts with
  several networks (multiple NICs, Docker, VPN) so both the broadcast and the hub's reply
  use the right one. The broadcast address is derived from that interface, so subnet masks
  other than /24 work as well (#331).
* **Manual hub IPs** — list your hub addresses. The adapter then contacts exactly those
  addresses and skips the broadcast entirely. Use this when a hub sits in a different
  subnet than ioBroker, or when broadcast traffic is blocked in your network (#147).

Instances updated from version 2.1.0 or older migrate the removed *Discovery-Subnets*
setting automatically on first start: an address that is the broadcast address of one of
your interfaces selects that interface, any other address becomes a manual hub IP. The
adapter logs what it converted.

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
### **WORK IN PROGRESS**
- (copilot) Adapter requires node.js >= 22 now
- (krobipd) State ID sanitisation hardened — tab/newline and other whitespace in hub-supplied device names no longer crash subscribe (#98). Dots are also collapsed so labels cannot split the ID path. Empty results fall back to `unnamed`.
- (krobipd) Async event handlers (`stateChange`, hub discovery, client online/offline/state) now have proper error handling — a single failing await no longer terminates the adapter with an unhandled promise rejection.
- (krobipd) Existing activities are now correctly recognised on every restart — the inverted `if` in `initHub` left the bookkeeping empty and made every activity log as `Added new activity` after each adapter start. As a side effect, activities deleted on the hub are now also pruned from the state tree, and the per-activity `-control` state is no longer falsely flagged as stale during the cleanup pass.
- (GermanBluefox) **Breaking:** the `Discovery-Subnets` setting was replaced by a network interface selector plus a manual hub list. Existing instances are migrated automatically on first start — a directed broadcast address selects the matching interface, any other address is carried over as a manual hub IP. The conversion is written to the log and runs exactly once.
- (GermanBluefox) **Breaking:** dots in hub, activity, device and command names are now replaced by `_` throughout, not just the first one. States whose name contained a dot are recreated under the new ID and the outdated objects are removed on the next hub sync. Adapt scripts, VIS views and aliases that referenced such states.
- (GermanBluefox) Discovery now restarts by itself after a socket error, with a delay growing from 30 s to at most 5 min, instead of staying silently dead until the adapter is restarted.
- (GermanBluefox) A single unreachable address no longer stops discovery for every other hub — send failures are logged per address.
- (GermanBluefox) A broadcast address entered in the manual hub list works again instead of failing with `EACCES` on every ping.
- (GermanBluefox) Dependencies updated: TypeScript 6, `@tsconfig/node22`, `@iobroker/adapter-core` 3.4.3, `@iobroker/testing` 5.3.0. The unused `sinon-chai` and `chai-as-promised` test helpers are gone.
- (GermanBluefox) `npm run build` and `npm run check` compile without errors again. The sources carried 26 strict-mode violations — unguarded `null` accesses on hub clients and discovery sockets, `Array.pop()` results used as strings, and `delete` on properties typed as required — none of which were caught because the scripts had been failing for a while.
- (GermanBluefox) `npm run lint` works again. It reported nothing but parse errors on every file (`project` and `projectService` were both enabled), and `allowDefaultProject` sat outside `projectService`, so no rule ever ran. An unused `tsconfig.json` left over from the vendored discovery library was shadowing the real one for everything under `src/discover/` and hid the Node.js types from the linter.

### 2.1.0 (2026-04-15)
- (copilot) Adapter requires admin >= 7.7.22 now

### 2.0.5 (2026-02-06)
* (@GermanBluefox) Corrected the type of value

### 2.0.4 (2026-01-29)
* (@brkai) Trying to fix the activities

### 2.0.3 (2025-11-04)
* (@GermanBluefox) Corrected the table in the configuration

### 2.0.2 (2025-11-03)
* (mcm1957) Adapter requires node.js >= 20, js-controller >= 6.0.11 and admin >= 7.6.17 now.
* (@GermanBluefox) Added state "switch" to switch activities on/off with Alexa
* (@GermanBluefox) Adapter has been rewritten with TypeScript
* (mcm1957) Dependencies have been updated.

## License
The MIT License (MIT)

Copyright (c) 2023-2026 iobroker-community-adapters <iobroker-community-adapters@gmx.de>  
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

[Older changelogs can be found there](CHANGELOG_OLD.md)
