![Logo](../../admin/harmony.png)

# ioBroker.harmony — Documentation

## Overview
The Harmony adapter allows you to control Logitech Harmony Hubs from ioBroker. Version 2.x adds a configuration UI that lets you view and edit hub settings without the Logitech cloud.

## Configuration Tab
The adapter adds a "Harmony" tab in the ioBroker admin sidebar. This tab provides:

- **Hub Overview** — Status, firmware version, activity and device counts
- **Activity Editor** — Edit activities, assign device roles, configure power sequences and FixIt rules
- **Device Editor** — Edit devices, view commands, configure power features
- **Setup Wizard** — Add new devices using the IR code database
- **Config Backup** — Export and import hub configurations as JSON

## States Reference

| State | Type | Writable | Description |
|-------|------|----------|-------------|
| `harmony.X.hubConnected` | boolean | no | Hub connection status |
| `harmony.X.hubBlocked` | boolean | no | Hub busy with operation |
| `harmony.X.activities.currentActivity` | string | no | Current activity name |
| `harmony.X.activities.currentStatus` | number | yes | 0=stopped, 1=starting, 2=running, 3=stopping |
| `harmony.X.activities.<name>` | number | yes | Activity status (write to start/stop) |
| `harmony.X.<device>.<command>` | number | yes | Send IR command (value = hold duration ms) |

## Setup
1. Install the adapter
2. Configure subnet or manual hub IPs in adapter settings
3. Open the "Harmony" tab in the sidebar to manage hub configuration
