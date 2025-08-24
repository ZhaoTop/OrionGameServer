const axios = require('axios');
const WebSocket = require('ws');

// 配置
const LOGIN_BASE_URL = 'http://localhost:3001';
const GATEWAY_WS_URL = 'ws://localhost:8080';

class ApiTester {
  constructor() {
    this.testResults = [];
    this.userTokens = {};
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  logResult(testName, success, details = '') {
    const result = { testName, success, details, timestamp: new Date() };
    this.testResults.push(result);
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName} ${details}`);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testHealthCheck() {
    try {
      const response = await axios.get(`${LOGIN_BASE_URL}/health`);
      this.logResult('Health Check', response.status === 200, `Status: ${response.status}`);
      return response.status === 200;
    } catch (error) {
      this.logResult('Health Check', false, `Error: ${error.message}`);
      return false;
    }
  }

  async testGuestLogin() {
    try {
      const deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const response = await axios.post(`${LOGIN_BASE_URL}/auth/guest-login`, {
        deviceId: deviceId
      });

      if (response.data.success && response.data.data.token) {
        this.userTokens.guest = response.data.data.token;
        this.userTokens.guestUserId = response.data.data.user.id;
        this.logResult('Guest Login', true, `Token obtained for device: ${deviceId}`);
        return true;
      } else {
        this.logResult('Guest Login', false, 'No token in response');
        return false;
      }
    } catch (error) {
      this.logResult('Guest Login', false, `Error: ${error.message}`);
      return false;
    }
  }

  async testUserRegistration() {
    try {
      const username = `testuser${Date.now()}`;
      const password = 'TestPass123';
      
      const response = await axios.post(`${LOGIN_BASE_URL}/auth/register`, {
        username,
        password,
        email: `${username}@test.com`
      });

      if (response.data.success && response.data.data.token) {
        this.userTokens.registered = response.data.data.token;
        this.userTokens.registeredUserId = response.data.data.user.id;
        this.userTokens.username = username;
        this.userTokens.password = password;
        this.logResult('User Registration', true, `User created: ${username}`);
        return true;
      } else {
        this.logResult('User Registration', false, 'Registration failed');
        return false;
      }
    } catch (error) {
      this.logResult('User Registration', false, `Error: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  async testUserLogin() {
    try {
      if (!this.userTokens.username || !this.userTokens.password) {
        this.logResult('User Login', false, 'No registered user to test with');
        return false;
      }

      const response = await axios.post(`${LOGIN_BASE_URL}/auth/login`, {
        username: this.userTokens.username,
        password: this.userTokens.password
      });

      if (response.data.success && response.data.data.token) {
        this.userTokens.login = response.data.data.token;
        this.logResult('User Login', true, `Login successful for: ${this.userTokens.username}`);
        return true;
      } else {
        this.logResult('User Login', false, 'Login failed');
        return false;
      }
    } catch (error) {
      this.logResult('User Login', false, `Error: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  async testTokenValidation() {
    try {
      const token = this.userTokens.registered || this.userTokens.guest;
      if (!token) {
        this.logResult('Token Validation', false, 'No token to validate');
        return false;
      }

      const response = await axios.post(`${LOGIN_BASE_URL}/auth/validate-token`, {
        token: token
      });

      if (response.data.success && response.data.data.valid) {
        this.logResult('Token Validation', true, 'Token is valid');
        return true;
      } else {
        this.logResult('Token Validation', false, 'Token validation failed');
        return false;
      }
    } catch (error) {
      this.logResult('Token Validation', false, `Error: ${error.message}`);
      return false;
    }
  }

  async testWebSocketConnection() {
    return new Promise((resolve) => {
      try {
        const token = this.userTokens.registered || this.userTokens.guest;
        if (!token) {
          this.logResult('WebSocket Connection', false, 'No token for WebSocket auth');
          resolve(false);
          return;
        }

        const ws = new WebSocket(GATEWAY_WS_URL);
        let connected = false;
        let authenticated = false;

        const timeout = setTimeout(() => {
          if (!connected) {
            this.logResult('WebSocket Connection', false, 'Connection timeout');
            ws.close();
            resolve(false);
          }
        }, 5000);

        ws.on('open', () => {
          connected = true;
          clearTimeout(timeout);
          this.log('WebSocket connected, attempting authentication...');
          
          // Send authentication message
          ws.send(JSON.stringify({
            type: 'auth',
            payload: { token }
          }));
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.log(`Received: ${JSON.stringify(message)}`);
            
            if (message.type === 'system' && !message.payload.error) {
              authenticated = true;
              this.logResult('WebSocket Connection', true, 'Connected and authenticated');
              ws.close();
              resolve(true);
            } else if (message.payload && message.payload.error) {
              this.logResult('WebSocket Connection', false, `Auth error: ${message.payload.error}`);
              ws.close();
              resolve(false);
            }
          } catch (e) {
            this.log(`Error parsing message: ${e.message}`);
          }
        });

        ws.on('error', (error) => {
          this.logResult('WebSocket Connection', false, `WebSocket error: ${error.message}`);
          resolve(false);
        });

        ws.on('close', () => {
          if (!authenticated && connected) {
            this.logResult('WebSocket Connection', false, 'Connection closed before authentication');
            resolve(false);
          }
        });

      } catch (error) {
        this.logResult('WebSocket Connection', false, `Error: ${error.message}`);
        resolve(false);
      }
    });
  }

  async testChatMessage() {
    return new Promise((resolve) => {
      try {
        const token = this.userTokens.registered || this.userTokens.guest;
        if (!token) {
          this.logResult('Chat Message Test', false, 'No token for chat test');
          resolve(false);
          return;
        }

        const ws = new WebSocket(GATEWAY_WS_URL);
        let messageReceived = false;

        const timeout = setTimeout(() => {
          if (!messageReceived) {
            this.logResult('Chat Message Test', false, 'No response received');
            ws.close();
            resolve(false);
          }
        }, 10000);

        ws.on('open', () => {
          // Authenticate first
          ws.send(JSON.stringify({
            type: 'auth',
            payload: { token }
          }));

          // Wait a bit then send chat message
          setTimeout(() => {
            ws.send(JSON.stringify({
              type: 'chat',
              payload: {
                type: 'global',
                content: 'Test chat message from API tester!'
              }
            }));
          }, 1000);
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'chat' || message.type === 'system') {
              messageReceived = true;
              clearTimeout(timeout);
              this.logResult('Chat Message Test', true, 'Chat message processed');
              ws.close();
              resolve(true);
            }
          } catch (e) {
            this.log(`Error parsing message: ${e.message}`);
          }
        });

        ws.on('error', (error) => {
          clearTimeout(timeout);
          this.logResult('Chat Message Test', false, `WebSocket error: ${error.message}`);
          resolve(false);
        });

      } catch (error) {
        this.logResult('Chat Message Test', false, `Error: ${error.message}`);
        resolve(false);
      }
    });
  }

  async runAllTests() {
    this.log('🚀 Starting API Tests...');
    
    const tests = [
      { name: 'Health Check', fn: () => this.testHealthCheck() },
      { name: 'Guest Login', fn: () => this.testGuestLogin() },
      { name: 'User Registration', fn: () => this.testUserRegistration() },
      { name: 'User Login', fn: () => this.testUserLogin() },
      { name: 'Token Validation', fn: () => this.testTokenValidation() },
      { name: 'WebSocket Connection', fn: () => this.testWebSocketConnection() },
      { name: 'Chat Message', fn: () => this.testChatMessage() },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      this.log(`\n📋 Running: ${test.name}`);
      try {
        const result = await test.fn();
        if (result) passed++;
        else failed++;
        await this.sleep(1000); // Wait between tests
      } catch (error) {
        this.logResult(test.name, false, `Unexpected error: ${error.message}`);
        failed++;
      }
    }

    this.log('\n📊 Test Results Summary:');
    this.log(`✅ Passed: ${passed}`);
    this.log(`❌ Failed: ${failed}`);
    this.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed > 0) {
      this.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => this.log(`  - ${r.testName}: ${r.details}`));
    }

    return { passed, failed, total: passed + failed };
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const tester = new ApiTester();
  
  console.log('🎯 OrionGameServer API Test Suite');
  console.log('Make sure the servers are running before starting tests!\n');
  
  // 等待服务器启动
  setTimeout(async () => {
    const results = await tester.runAllTests();
    process.exit(results.failed > 0 ? 1 : 0);
  }, 2000);
}

module.exports = ApiTester;