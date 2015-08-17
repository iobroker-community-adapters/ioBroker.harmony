![Logo](admin/harmony.png)
# ioBroker Logitech Harmony Adapter

Control your harmony activities from ioBroker.

## Install
Install Harmony via ioBroker Admin.

1. Make sure Instance is running.
2. Open instance config dialog
3. Press "Find Hub"
4. A Popup lists all Harmony Hubs found on your network. Click on a Hub to select it.
5. Make sure "Sync with Hub" is selected 
5. Save the configuration, the Hub

You need to select "Sync with Hub" again after adding/updating/deleting devices or activities!

## Usage
###Activities
**Start:**  
Set the status state 'Instance.Hub_Name.activities.Activity_Name' to a Number greater than 0.
During the activity's startup sequence the status changes from 1 (startup) to 2(running)

**Stop:**  
Set the state 'Instance.Hub_Name.activities.Activity_Name' to 0.
Alternatively, you can set the hub's status 'Instance.activities.currentStatus' to any number.
During the activity's exit sequence the status changes from 3 (stopping) to 0 (stopped)

###Indicators
There are two indicators 'Instance.Hub_Name.activity' and 'Instance.Hub_Name.connected'. Both are read-only, changing their values has no effect.

**.hubConnected**  
Tells you whether the adapter is successfully connected to the hub.
 
**.hubBlocked**  
Is set to true if Hub is busy starting/stopping activities or sending commands.
 
**activities.currentActivity**  
Gives you the name of the currently running activity.

**activities.currentStatus**  
Gives you the current status of the hub.

###Devices
**Send Command**  
Set 'Instance.Hub_Name.Device_Name.command' to a number x to send command for x milliseconds.  
A value smaller than 250 probably will send the command only once.
After sending the state will be set to 0 again.

## Changelog

### 0.5.1
* (Pmant) fix: bug with wring states

### 0.5.0
* (Pmant) change: object structure (delete instance once if had 0.2.1 or lower installed!)
* (Pmant) add: send commands for x milliseconds
* (Pmant) add: delete unused activities and devices
* (Pmant) add: delay commands when hub is busy

### 0.2.1
* (bluefox) change logo

### 0.2.0
* (Pmant) switch activity on state change
* (Pmant) stop current activity on hub status change
* (Pmant) move activities to activity channel
* (Pmant) add devices channel
* (Pmant) add device control

### 0.1.2
* (Pmant) hub discovery

### 0.1.1
* (Pmant) fixes

### 0.1.0
* (Pmant) keep alive connection to hub
* (Pmant) create/update objects and states
* (Pmant) update current activity status

### 0.0.1
* (Pmant) connect to hub
* (Pmant) listen for activies


### TODO
* translations

### License
MIT



