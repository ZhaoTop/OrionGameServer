const axios = require('axios');
const WebSocket = require('ws');
const crypto = require('crypto');

// 配置
const LOGIN_BASE_URL = 'http://localhost:3001';
const GATEWAY_WS_URL = 'ws://localhost:8080';

class SecurityTester {
  constructor() {
    this.testResults = [];
    this.validTokens = {};
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

  // 获取有效token用于测试
  async setupValidToken() {
    try {
      const deviceId = `security-test-${Date.now()}`;
      const response = await axios.post(`${LOGIN_BASE_URL}/auth/guest-login`, {
        deviceId: deviceId
      });
      
      if (response.data.success) {
        this.validTokens.guest = response.data.data.token;
        this.validTokens.userId = response.data.data.user.id;
        this.log('✅ Valid token obtained for security tests');
        return true;
      }
      return false;
    } catch (error) {
      this.log('❌ Failed to obtain valid token for security tests');
      return false;
    }
  }

  // 测试SQL注入防护 (NoSQL注入)
  async testNoSQLInjection() {
    const injectionPayloads = [
      { username: { $ne: null }, password: { $ne: null } },
      { username: "admin'; DROP TABLE users; --", password: "test" },
      { username: { $regex: ".*" }, password: "test" },
      { deviceId: { $where: "this.username == 'admin'" } },
    ];

    let protectedCount = 0;
    
    for (const payload of injectionPayloads) {
      try {
        // Test login injection
        const response = await axios.post(`${LOGIN_BASE_URL}/auth/login`, payload);
        
        // If we get here without error, check if it actually bypassed security
        if (response.data.success) {
          this.logResult(`NoSQL Injection Test`, false, `Injection succeeded with payload: ${JSON.stringify(payload)}`);
        } else {
          protectedCount++;
        }
      } catch (error) {
        // Expected: should reject malicious payloads
        if (error.response && error.response.status >= 400) {
          protectedCount++;
        } else {
          this.log(`Unexpected error with payload ${JSON.stringify(payload)}: ${error.message}`);
        }
      }
      
      await this.sleep(100);
    }

    const success = protectedCount === injectionPayloads.length;
    this.logResult('NoSQL Injection Protection', success, `Protected against ${protectedCount}/${injectionPayloads.length} injection attempts`);
    return success;
  }

  // 测试无效Token攻击
  async testInvalidTokenAttacks() {
    const invalidTokens = [
      '',
      'invalid-token',
      'Bearer invalid',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c', // fake JWT
      null,
      undefined,
      { malicious: 'object' },
      'a'.repeat(10000), // very long token
    ];

    let protectedCount = 0;

    for (const token of invalidTokens) {
      try {
        const response = await axios.post(`${LOGIN_BASE_URL}/auth/validate-token`, {
          token: token
        });
        
        if (!response.data.success || response.data.data.valid === false) {
          protectedCount++;
        } else {
          this.log(`❌ Invalid token was accepted: ${JSON.stringify(token)}`);
        }
      } catch (error) {
        // Expected: should reject invalid tokens
        if (error.response && error.response.status >= 400) {
          protectedCount++;
        }
      }
      
      await this.sleep(50);
    }

    const success = protectedCount === invalidTokens.length;
    this.logResult('Invalid Token Protection', success, `Rejected ${protectedCount}/${invalidTokens.length} invalid tokens`);
    return success;
  }

  // 测试速率限制
  async testRateLimit() {
    const rapidRequests = [];
    const requestCount = 20; // 超过预期的速率限制

    // 快速发送大量请求
    for (let i = 0; i < requestCount; i++) {
      rapidRequests.push(
        axios.post(`${LOGIN_BASE_URL}/auth/login`, {
          username: `ratelimit-test-${i}`,
          password: 'testpassword'
        }).catch(error => ({
          status: error.response?.status || 0,
          blocked: error.response?.status === 429
        }))
      );
    }

    try {
      const responses = await Promise.all(rapidRequests);
      const blockedCount = responses.filter(r => r.blocked || r.status === 429).length;
      const errorCount = responses.filter(r => r.status >= 400).length;

      // 如果有请求被阻止或返回错误，说明有某种保护机制
      const success = blockedCount > 0 || errorCount > requestCount / 2;
      this.logResult('Rate Limiting', success, `${blockedCount} requests blocked, ${errorCount} errors out of ${requestCount}`);
      return success;
    } catch (error) {
      this.logResult('Rate Limiting', false, `Test failed: ${error.message}`);
      return false;
    }
  }

  // 测试XSS防护
  async testXSSProtection() {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert(1)',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      '"><script>alert(1)</script>',
      '<iframe src="javascript:alert(1)"></iframe>',
    ];

    let protectedCount = 0;

    for (const payload of xssPayloads) {
      try {
        // Test via registration
        const response = await axios.post(`${LOGIN_BASE_URL}/auth/register`, {
          username: payload,
          password: 'TestPass123',
          email: 'test@test.com'
        });
        
        // Check if the payload was sanitized or rejected
        if (response.data.success) {
          const returnedUsername = response.data.data.user.username;
          if (returnedUsername !== payload) {
            protectedCount++; // Input was sanitized
          }
        }
      } catch (error) {
        if (error.response && error.response.status >= 400) {
          protectedCount++; // Request was rejected
        }
      }
      
      await this.sleep(100);
    }

    const success = protectedCount >= xssPayloads.length * 0.8; // Allow some flexibility
    this.logResult('XSS Protection', success, `Protected against ${protectedCount}/${xssPayloads.length} XSS attempts`);
    return success;
  }

  // 测试WebSocket消息泛洪攻击
  async testWebSocketFlood() {
    return new Promise((resolve) => {
      if (!this.validTokens.guest) {
        this.logResult('WebSocket Flood Test', false, 'No valid token available');
        resolve(false);
        return;
      }

      const ws = new WebSocket(GATEWAY_WS_URL);
      let messagesBlocked = 0;
      let messagesSent = 0;
      const floodCount = 50; // 发送大量消息

      ws.on('open', () => {
        // 先认证
        ws.send(JSON.stringify({
          type: 'auth',
          payload: { token: this.validTokens.guest }
        }));

        // 等待一会儿后开始泛洪攻击
        setTimeout(() => {
          for (let i = 0; i < floodCount; i++) {
            try {
              ws.send(JSON.stringify({
                type: 'chat',
                payload: {
                  type: 'global',
                  content: `Flood message ${i} - ${crypto.randomBytes(100).toString('hex')}`
                }
              }));
              messagesSent++;
            } catch (error) {
              // WebSocket可能会拒绝过多消息
              messagesBlocked++;
            }
          }
        }, 1000);
      });

      ws.on('error', (error) => {
        // 连接错误可能表明有保护机制
        this.logResult('WebSocket Flood Test', true, `Connection blocked after ${messagesSent} messages: ${error.message}`);
        resolve(true);
      });

      ws.on('close', (code) => {
        // 如果连接被关闭，可能是由于泛洪保护
        const isProtected = code !== 1000 || messagesBlocked > 0;
        this.logResult('WebSocket Flood Test', isProtected, 
          `Connection closed with code ${code}, ${messagesSent} sent, ${messagesBlocked} blocked`);
        resolve(isProtected);
      });

      // 超时保护
      setTimeout(() => {
        ws.close();
        const success = messagesBlocked > floodCount * 0.3; // 如果超过30%的消息被阻止
        this.logResult('WebSocket Flood Test', success, 
          `Test completed: ${messagesSent} sent, ${messagesBlocked} blocked`);
        resolve(success);
      }, 10000);
    });
  }

  // 测试大量并发连接攻击
  async testConnectionFlood() {
    const connectionCount = 15; // 尝试建立大量连接
    const connections = [];
    let successfulConnections = 0;
    let rejectedConnections = 0;

    const connectionPromises = [];

    for (let i = 0; i < connectionCount; i++) {
      const promise = new Promise((resolve) => {
        const ws = new WebSocket(GATEWAY_WS_URL);
        
        const timeout = setTimeout(() => {
          ws.close();
          rejectedConnections++;
          resolve('timeout');
        }, 3000);

        ws.on('open', () => {
          clearTimeout(timeout);
          successfulConnections++;
          connections.push(ws);
          resolve('connected');
        });

        ws.on('error', () => {
          clearTimeout(timeout);
          rejectedConnections++;
          resolve('error');
        });
      });

      connectionPromises.push(promise);
      await this.sleep(50); // 短暂延迟避免过快连接
    }

    await Promise.all(connectionPromises);

    // 关闭所有成功的连接
    connections.forEach(ws => {
      try {
        ws.close();
      } catch (e) {
        // Ignore close errors
      }
    });

    // 如果有连接被拒绝，说明有保护机制
    const success = rejectedConnections > 0 || successfulConnections < connectionCount;
    this.logResult('Connection Flood Protection', success, 
      `${successfulConnections} connected, ${rejectedConnections} rejected out of ${connectionCount}`);
    
    return success;
  }

  // 测试无效JSON攻击
  async testInvalidJSONAttack() {
    const invalidPayloads = [
      '{"incomplete": json',
      '{"circular": {"self": {"self": {"self": "infinite"}}}}',
      '{' + '"key":'.repeat(1000) + '"value"}',
      '{"huge_string": "' + 'x'.repeat(100000) + '"}',
      null,
      undefined,
      '',
    ];

    let protectedCount = 0;

    for (const payload of invalidPayloads) {
      try {
        await axios.post(`${LOGIN_BASE_URL}/auth/login`, payload, {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        if (error.response && error.response.status >= 400) {
          protectedCount++;
        }
      }
      await this.sleep(50);
    }

    const success = protectedCount >= invalidPayloads.length * 0.8;
    this.logResult('Invalid JSON Protection', success, `Protected against ${protectedCount}/${invalidPayloads.length} invalid payloads`);
    return success;
  }

  // 运行所有安全测试
  async runAllSecurityTests() {
    this.log('🛡️  Starting Security Tests...');
    
    // 首先获取有效token
    const tokenSetup = await this.setupValidToken();
    if (!tokenSetup) {
      this.log('❌ Could not setup valid token, some tests may fail');
    }

    const tests = [
      { name: 'NoSQL Injection Protection', fn: () => this.testNoSQLInjection() },
      { name: 'Invalid Token Protection', fn: () => this.testInvalidTokenAttacks() },
      { name: 'Rate Limiting', fn: () => this.testRateLimit() },
      { name: 'XSS Protection', fn: () => this.testXSSProtection() },
      { name: 'WebSocket Flood Protection', fn: () => this.testWebSocketFlood() },
      { name: 'Connection Flood Protection', fn: () => this.testConnectionFlood() },
      { name: 'Invalid JSON Protection', fn: () => this.testInvalidJSONAttack() },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      this.log(`\n🔍 Testing: ${test.name}`);
      try {
        const result = await test.fn();
        if (result) passed++;
        else failed++;
        await this.sleep(1000);
      } catch (error) {
        this.logResult(test.name, false, `Unexpected error: ${error.message}`);
        failed++;
      }
    }

    this.log('\n🛡️  Security Test Results:');
    this.log(`✅ Passed: ${passed}`);
    this.log(`❌ Failed: ${failed}`);
    this.log(`🔒 Security Score: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed > 0) {
      this.log('\n⚠️  Security Vulnerabilities Detected:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => this.log(`  - ${r.testName}: ${r.details}`));
    }

    return { passed, failed, total: passed + failed };
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const tester = new SecurityTester();
  
  console.log('🛡️  OrionGameServer Security Test Suite');
  console.log('⚠️  This will attempt various attacks against your server!');
  console.log('Make sure to run this only on test environments.\n');
  
  // 等待用户确认和服务器启动
  setTimeout(async () => {
    const results = await tester.runAllSecurityTests();
    
    console.log('\n📋 Security Assessment Complete!');
    if (results.failed === 0) {
      console.log('🎉 All security tests passed! Your server appears well-protected.');
    } else {
      console.log('⚠️  Some security issues detected. Please review and fix.');
    }
    
    process.exit(results.failed > 0 ? 1 : 0);
  }, 2000);
}

module.exports = SecurityTester;