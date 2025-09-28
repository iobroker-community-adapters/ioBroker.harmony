# ioBroker Adapter Development with GitHub Copilot

**Version:** 0.4.0
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on ioBroker adapter development.

## Project Context

You are working on an ioBroker adapter. ioBroker is an integration platform for the Internet of Things, focused on building smart home and industrial IoT solutions. Adapters are plugins that connect ioBroker to external systems, devices, or services.

## Adapter-Specific Context
- **Adapter Name**: harmony
- **Primary Function**: Control Logitech Harmony activities and hubs from ioBroker
- **Key Dependencies**: @harmonyhub/discover (hub discovery), harmonyhubws (WebSocket communication), semaphore (connection management)
- **Configuration Requirements**: Hub discovery settings, subnet configuration for multi-network setups
- **Target Devices**: Logitech Harmony hubs and connected infrared/smart home devices
- **API Integration**: Uses Harmony Hub local API for device control and activity management

## Testing

### Unit Testing
- Use Jest as the primary testing framework for ioBroker adapters
- Create tests for all adapter main functions and helper methods
- Test error handling scenarios and edge cases
- Mock external API calls and hardware dependencies
- For adapters connecting to APIs/devices not reachable by internet, provide example data files to allow testing of functionality without live connections
- Example test structure:
  ```javascript
  describe('AdapterName', () => {
    let adapter;
    
    beforeEach(() => {
      // Setup test adapter instance
    });
    
    test('should initialize correctly', () => {
      // Test adapter initialization
    });
  });
  ```

### Integration Testing

**IMPORTANT**: Use the official `@iobroker/testing` framework for all integration tests. This is the ONLY correct way to test ioBroker adapters.

**Official Documentation**: https://github.com/ioBroker/testing

#### Framework Structure
Integration tests MUST follow this exact pattern:

```javascript
const path = require('path');
const { tests } = require('@iobroker/testing');

// Define test coordinates or configuration
const TEST_COORDINATES = '52.520008,13.404954'; // Berlin
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Use tests.integration() with defineAdditionalTests
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('Test adapter with specific configuration', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should configure and start adapter', function () {
                return new Promise(async (resolve, reject) => {
                    try {
                        harness = getHarness();
                        
                        // Get adapter object using promisified pattern
                        const obj = await new Promise((res, rej) => {
                            harness.objects.getObject('system.adapter.your-adapter.0', (err, o) => {
                                if (err) return rej(err);
                                res(o);
                            });
                        });
                        
                        if (!obj) {
                            return reject(new Error('Adapter object not found'));
                        }

                        // Configure adapter properties
                        Object.assign(obj.native, {
                            position: TEST_COORDINATES,
                            createCurrently: true,
                            createHourly: true,
                            createDaily: true,
                            // Add other configuration as needed
                        });

                        // Set the updated configuration
                        harness.objects.setObject(obj._id, obj);

                        console.log('✅ Step 1: Configuration written, starting adapter...');
                        
                        // Start adapter and wait
                        await harness.startAdapterAndWait();
                        
                        console.log('✅ Step 2: Adapter started');

                        // Wait for adapter to process data
                        const waitMs = 15000;
                        await wait(waitMs);

                        console.log('🔍 Step 3: Checking states after adapter run...');
                        
                        // Validate created states
                        const states = await harness.states.getKeysAsync('your-adapter.0.*');
                        
                        if (states.length === 0) {
                            return reject(new Error(`No states found for adapter instance`));
                        }

                        console.log(`✅ Found ${states.length} states created by adapter`);
                        
                        resolve();
                    } catch (error) {
                        console.error('Integration test failed:', error.message);
                        reject(error);
                    }
                }).timeout(180000);
            });
        });
    }
});
```

#### For Hardware-Connected Adapters (Like Harmony)

For adapters that connect to hardware devices not available during CI/CD:

```javascript
// Mock external dependencies for testing
const mockHarmonyHub = {
    discover: () => Promise.resolve([{
        ip: '192.168.1.100',
        uuid: 'harmony-test-uuid',
        friendlyName: 'Test Harmony Hub'
    }]),
    
    connect: () => Promise.resolve({
        getActivities: () => Promise.resolve([
            { id: '12345', label: 'Watch TV' },
            { id: '67890', label: 'Listen Music' }
        ]),
        startActivity: (id) => Promise.resolve(),
        endActivity: () => Promise.resolve()
    })
};

// Test with mock data
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('Harmony Hub Integration with Mock', (getHarness) => {
            it('should handle hub discovery and activity control', async function() {
                // Test logic with mock harmony hub
                const activities = await mockHarmonyHub.discover();
                expect(activities).toHaveLength(1);
            }).timeout(30000);
        });
    }
});
```

## ioBroker Adapter Development Patterns

### Adapter Lifecycle Management
```javascript
class MyAdapter extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: 'my-adapter',
    });
    
    this.on('ready', this.onReady.bind(this));
    this.on('unload', this.onUnload.bind(this));
  }

  async onReady() {
    // Initialize adapter
    this.setState('info.connection', false, true);
    
    try {
      await this.initializeConnection();
      this.setState('info.connection', true, true);
    } catch (error) {
      this.log.error(`Failed to initialize: ${error.message}`);
    }
  }

  onUnload(callback) {
    try {
      // Clean up resources
      if (this.connectionTimer) {
        clearTimeout(this.connectionTimer);
        this.connectionTimer = undefined;
      }
      // Close connections, clean up resources
      callback();
    } catch (e) {
      callback();
    }
  }
}
```

### State Management
```javascript
// Creating states with proper definitions
await this.setObjectNotExistsAsync('devices.hub1.activities.watchTV', {
  type: 'state',
  common: {
    name: 'Watch TV Activity',
    type: 'number',
    role: 'level',
    read: true,
    write: true,
    min: 0,
    max: 2,
    states: {
      0: 'stopped',
      1: 'starting', 
      2: 'running'
    }
  },
  native: {}
});

// Setting states with acknowledgment
await this.setStateAsync('devices.hub1.activities.watchTV', 1, true);
```

### Error Handling and Logging
```javascript
// Proper error handling with different log levels
try {
  const result = await this.harmonyHub.startActivity(activityId);
  this.log.info(`Activity ${activityId} started successfully`);
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    this.log.warn('Harmony Hub connection refused - will retry');
    this.scheduleReconnect();
  } else {
    this.log.error(`Failed to start activity: ${error.message}`);
  }
}
```

### Configuration Management
```javascript
// Access adapter configuration
const hubIp = this.config.hubIp;
const pollInterval = this.config.pollInterval || 30000;
const subnets = this.config.subnets ? this.config.subnets.split(',') : [];

// Validate configuration
if (!hubIp && subnets.length === 0) {
  this.log.error('No hub IP or discovery subnets configured');
  return;
}
```

## Hardware Integration Best Practices (Harmony-Specific)

### Hub Discovery
```javascript
// Multi-subnet discovery for different network configurations
async discoverHubs() {
  const discoveryPromises = [];
  
  if (this.config.subnets) {
    const subnets = this.config.subnets.split(',').map(s => s.trim());
    for (const subnet of subnets) {
      discoveryPromises.push(this.discoverInSubnet(subnet));
    }
  } else {
    discoveryPromises.push(this.discoverInSubnet());
  }
  
  const results = await Promise.allSettled(discoveryPromises);
  return results.filter(r => r.status === 'fulfilled').flatMap(r => r.value);
}
```

### Connection Management
```javascript
// Robust connection handling with reconnection logic
async establishConnection(hubIp) {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      this.harmonyClient = new HarmonyClient(hubIp);
      await this.harmonyClient.connect();
      this.log.info(`Connected to Harmony Hub at ${hubIp}`);
      return true;
    } catch (error) {
      attempts++;
      this.log.warn(`Connection attempt ${attempts}/${maxAttempts} failed: ${error.message}`);
      
      if (attempts < maxAttempts) {
        await this.delay(5000 * attempts); // Exponential backoff
      }
    }
  }
  
  return false;
}
```

### Activity State Management
```javascript
// Track activity states through their lifecycle
async handleActivityChange(activityId, targetState) {
  const activityPath = `activities.${activityId}`;
  
  try {
    // Set intermediate state
    await this.setStateAsync(activityPath, targetState === 0 ? 3 : 1, true);
    
    if (targetState === 0) {
      await this.harmonyClient.endActivity();
    } else {
      await this.harmonyClient.startActivity(activityId);
    }
    
    // Set final state
    await this.setStateAsync(activityPath, targetState === 0 ? 0 : 2, true);
    
  } catch (error) {
    this.log.error(`Activity ${activityId} change failed: ${error.message}`);
    // Revert to previous state
    const currentActivity = await this.harmonyClient.getCurrentActivity();
    await this.updateActivityStates(currentActivity);
  }
}
```

## JSON-Config Integration

### Dynamic Configuration Forms
```javascript
// io-package.json configuration for dynamic hub discovery
{
  "native": {
    "hubIp": "",
    "subnets": "",
    "pollInterval": 30000,
    "discoverHubs": true,
    "activities": []
  },
  "objects": [],
  "instanceObjects": [
    {
      "_id": "info",
      "type": "channel",
      "common": {
        "name": "Information"
      },
      "native": {}
    }
  ]
}
```

### Admin Configuration
```javascript
// Handle dynamic configuration updates
onObjectChange(id, obj) {
  if (id === `${this.namespace}.config` && obj) {
    // Configuration changed - reconnect if needed
    if (obj.native.hubIp !== this.config.hubIp) {
      this.log.info('Hub IP changed - reconnecting');
      this.reconnectToHub(obj.native.hubIp);
    }
  }
}
```

## Code Style and Standards

- Follow JavaScript/TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper resource cleanup in `unload()` method
- Use semantic versioning for adapter releases
- Include proper JSDoc comments for public methods

## CI/CD and Testing Integration

### GitHub Actions for API Testing
For adapters with external API dependencies, implement separate CI/CD jobs:

```yaml
# Tests API connectivity with demo credentials (runs separately)
demo-api-tests:
  if: contains(github.event.head_commit.message, '[skip ci]') == false
  
  runs-on: ubuntu-22.04
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run demo API tests
      run: npm run test:integration-demo
```

### CI/CD Best Practices
- Run credential tests separately from main test suite
- Use ubuntu-22.04 for consistency
- Don't make credential tests required for deployment
- Provide clear failure messages for API connectivity issues
- Use appropriate timeouts for external API calls (120+ seconds)

### Package.json Script Integration
Add dedicated script for credential testing:
```json
{
  "scripts": {
    "test:integration-demo": "mocha test/integration-demo --exit"
  }
}
```

### Practical Example: Complete API Testing Implementation
Here's a complete example based on lessons learned from the Discovergy adapter:

#### test/integration-demo.js
```javascript
const path = require("path");
const { tests } = require("@iobroker/testing");

// Helper function to encrypt password using ioBroker's encryption method
async function encryptPassword(harness, password) {
    const systemConfig = await harness.objects.getObjectAsync("system.config");
    
    if (!systemConfig || !systemConfig.native || !systemConfig.native.secret) {
        throw new Error("Could not retrieve system secret for password encryption");
    }
    
    const secret = systemConfig.native.secret;
    let result = '';
    for (let i = 0; i < password.length; ++i) {
        result += String.fromCharCode(secret[i % secret.length].charCodeAt(0) ^ password.charCodeAt(i));
    }
    
    return result;
}

// Run integration tests with demo credentials
tests.integration(path.join(__dirname, ".."), {
    defineAdditionalTests({ suite }) {
        suite("API Testing with Demo Credentials", (getHarness) => {
            let harness;
            
            before(() => {
                harness = getHarness();
            });

            it("Should connect to API and initialize with demo credentials", async () => {
                console.log("Setting up demo credentials...");
                
                if (harness.isAdapterRunning()) {
                    await harness.stopAdapter();
                }
                
                const encryptedPassword = await encryptPassword(harness, "demo_password");
                
                await harness.changeAdapterConfig("your-adapter", {
                    native: {
                        username: "demo@provider.com",
                        password: encryptedPassword,
                        // other config options
                    }
                });

                console.log("Starting adapter with demo credentials...");
                await harness.startAdapter();
                
                // Wait for API calls and initialization
                await new Promise(resolve => setTimeout(resolve, 60000));
                
                const connectionState = await harness.states.getStateAsync("your-adapter.0.info.connection");
                
                if (connectionState && connectionState.val === true) {
                    console.log("✅ SUCCESS: API connection established");
                    return true;
                } else {
                    throw new Error("API Test Failed: Expected API connection to be established with demo credentials. " +
                        "Check logs above for specific API errors (DNS resolution, 401 Unauthorized, network issues, etc.)");
                }
            }).timeout(120000);
        });
    }
});
```

## Harmony Hub Specific Development Context

### Hub Communication Patterns
```javascript
// WebSocket-based communication with Harmony Hub
class HarmonyConnection {
  constructor(ip) {
    this.hubIP = ip;
    this.client = null;
    this.activities = new Map();
  }

  async connect() {
    try {
      this.client = new HarmonyHubWS(this.hubIP);
      await this.client.connect();
      
      // Load available activities
      const activities = await this.client.getActivities();
      activities.forEach(activity => {
        this.activities.set(activity.id, activity);
      });
      
      return true;
    } catch (error) {
      throw new Error(`Failed to connect to Harmony Hub at ${this.hubIP}: ${error.message}`);
    }
  }

  async startActivity(activityId) {
    if (!this.activities.has(activityId)) {
      throw new Error(`Activity ${activityId} not found`);
    }
    
    return this.client.startActivity(activityId);
  }
}
```

### Device Control Implementation
```javascript
// Control individual devices through Harmony Hub
async sendDeviceCommand(deviceId, command) {
  try {
    await this.harmonyClient.sendCommand({
      device: deviceId,
      command: command
    });
    
    this.log.debug(`Sent command ${command} to device ${deviceId}`);
  } catch (error) {
    this.log.warn(`Failed to send command to device ${deviceId}: ${error.message}`);
  }
}
```

### Multi-Hub Support
```javascript
// Support multiple Harmony Hubs in different locations
async initializeHubs() {
  const discoveredHubs = await this.discoverHubs();
  
  for (const hub of discoveredHubs) {
    try {
      const connection = new HarmonyConnection(hub.ip);
      await connection.connect();
      
      this.hubs.set(hub.uuid, {
        connection: connection,
        info: hub,
        lastSeen: Date.now()
      });
      
      // Create ioBroker objects for this hub
      await this.createHubObjects(hub);
      
    } catch (error) {
      this.log.error(`Failed to initialize hub ${hub.friendlyName}: ${error.message}`);
    }
  }
}
```