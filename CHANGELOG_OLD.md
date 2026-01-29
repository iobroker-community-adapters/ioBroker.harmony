# Older Changelogs
## 1.3.0 (2023-11-08)
* (mcm1957) Adapter requires nodejs 16 now.
* (mcm1957) Adapter has been moved to iobroker-community-adapters organisation.
* (mcm1957) Dependencies have been updated.

## 1.2.2 (2019-03-11)
* (foxriver76) reduce discover interval and only log newly discovered hubs

## 1.2.1 (2019-02-21)
* (foxriver76) use at least 1.0.5 of harmonyhubws

## 1.2.0 (2019-01-06)
* (foxriver76) compact mode compatibility added

## 1.1.5 (2018-12-28)
* (Pmant) fix hold key (for values > 250ms)

## 1.1.4 (2018-12-25)
* (Pmant) fix single key presses

## 1.1.2
* (Pmant) reduce log spam
* (Pmant) fix multiple instances of one hub

## 1.1.1
* (Pmant) switch to api module

## 1.1.0
* (Pmant) switch to websocket client

## 1.0.0
* (foxriver76) replace blanks by underscores
* (foxriver76) minor readme adjustments
* (foxriver76) discover interval 1000 ms by default again

## 0.10.2
* (foxriver76) added discover interval and port to code
* (foxriver76) discover interval is now 300 ms instead of 1000 ms

## 0.10.0
* (foxriver76) added possibility to specify subnet for discovery
* (foxriver76) fix translations
* (foxriver76) Logging improved
* (foxriver76) materialized index.html for admin v3
* (foxriver76) make sure callback in unload is called

## 0.9.6
* (foxriver76) updating code to es6
* (foxriver76) using maintained harmony libs for discover and client
* (foxriver76) possibility to only add whitelisted hubs
* (foxriver76) MAX_CLIENTS = 6 error fixed
* (foxriver76) enhanced logging
* (foxriver76) changes for new libs

## 0.9.3
* (justr1) fix error with hubname

## 0.9.1
please delete all harmony.x objects once
* (Pmant) fix problematic chars

## 0.7.0
* (Pmant) support multiple hubs
* (Pmant) removed hub config from admin
* (Pmant) find free Port for Hub-Discovery

## 0.6.2
* (Pmant) fix wrong port

## 0.6.1
* (Pmant) reduce logging

## 0.6.0
* (Pmant) fix admin in firefox
* (Pmant) improve connection stability (needs testing)

## 0.5.6
* (PArns) update harmony lib
* (PArns) removed unneeded functions due to lib update
* (Pmant) fix bug with blocked state

## 0.5.5
* (Pmant) fix hub lifecycle

## 0.5.4
* (Pmant) fix node 5.0.0

## 0.5.3
* (Pmant) fix node-xmpp-client version

## 0.5.2
* (Pmant) change: add instance after installation
* (Pmant) fix: deletes history settings

## 0.5.1
* (Pmant) fix: bug with wrong states

## 0.5.0
* (Pmant) change: object structure (delete instance once if had 0.2.1 or lower installed!)
* (Pmant) add: send commands for x milliseconds
* (Pmant) add: delete unused activities and devices
* (Pmant) add: delay commands when hub is busy

## 0.2.1
* (bluefox) change logo

## 0.2.0
* (Pmant) switch activity on state change
* (Pmant) stop current activity on hub status change
* (Pmant) move activities to activity channel
* (Pmant) add devices channel
* (Pmant) add device control

## 0.1.2
* (Pmant) hub discovery

## 0.1.1
* (Pmant) fixes

## 0.1.0
* (Pmant) keep alive connection to hub
* (Pmant) create/update objects and states
* (Pmant) update current activity status

## 0.0.1
* (Pmant) connect to hub
* (Pmant) listen for activities
