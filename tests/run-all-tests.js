const { spawn } = require('child_process');
const axios = require('axios');

class TestRunner {
  constructor() {
    this.serverProcess = null;
    this.LOGIN_BASE_URL = 'http://localhost:3001';
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  // 启动服务器
  async startServer() {
    return new Promise((resolve, reject) => {
      this.log('🚀 Starting OrionGameServer...');
      
      // 使用tsx运行TypeScript代码，跳过编译
      this.serverProcess = spawn('npx', ['tsx', 'src/index.ts'], {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true
      });

      let serverOutput = '';
      let serverReady = false;

      // 监听服务器输出
      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        serverOutput += output;
        process.stdout.write(`[SERVER] ${output}`);

        // 检查服务器是否准备就绪
        if (output.includes('started') || output.includes('listening')) {
          if (!serverReady) {
            serverReady = true;
            setTimeout(() => resolve(), 2000); // 等待2秒确保完全启动
          }
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        const output = data.toString();
        process.stderr.write(`[SERVER ERROR] ${output}`);
      });

      this.serverProcess.on('close', (code) => {
        this.log(`Server process exited with code ${code}`);
      });

      this.serverProcess.on('error', (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      // 超时保护
      setTimeout(() => {
        if (!serverReady) {
          reject(new Error('Server startup timeout'));
        }
      }, 30000);
    });
  }

  // 检查服务器健康状态
  async waitForServerHealth() {
    const maxAttempts = 10;
    const delay = 2000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.log(`Health check attempt ${attempt}/${maxAttempts}...`);
        const response = await axios.get(`${this.LOGIN_BASE_URL}/health`, {
          timeout: 5000
        });
        
        if (response.status === 200) {
          this.log('✅ Server is healthy and ready!');
          return true;
        }
      } catch (error) {
        this.log(`❌ Health check failed: ${error.message}`);
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error('Server failed to respond to health checks');
  }

  // 运行API测试
  async runApiTests() {
    this.log('📋 Running API Tests...');
    
    return new Promise((resolve, reject) => {
      const testProcess = spawn('node', ['tests/api-test.js'], {
        stdio: 'inherit',
        shell: true
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          this.log('✅ API Tests completed successfully');
          resolve(true);
        } else {
          this.log('❌ API Tests failed');
          resolve(false);
        }
      });

      testProcess.on('error', (error) => {
        reject(new Error(`API test process failed: ${error.message}`));
      });
    });
  }

  // 运行安全测试
  async runSecurityTests() {
    this.log('🛡️  Running Security Tests...');
    
    return new Promise((resolve, reject) => {
      const testProcess = spawn('node', ['tests/security-test.js'], {
        stdio: 'inherit',
        shell: true
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          this.log('✅ Security Tests completed successfully');
          resolve(true);
        } else {
          this.log('⚠️  Security Tests detected issues');
          resolve(false); // 不算作失败，只是检测到安全问题
        }
      });

      testProcess.on('error', (error) => {
        reject(new Error(`Security test process failed: ${error.message}`));
      });
    });
  }

  // 停止服务器
  async stopServer() {
    if (this.serverProcess) {
      this.log('🛑 Stopping server...');
      
      // 尝试优雅关闭
      this.serverProcess.kill('SIGTERM');
      
      // 等待一会儿
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 如果仍在运行，强制关闭
      if (!this.serverProcess.killed) {
        this.serverProcess.kill('SIGKILL');
      }
      
      this.serverProcess = null;
      this.log('✅ Server stopped');
    }
  }

  // 运行所有测试
  async runAllTests() {
    let apiSuccess = false;
    let securitySuccess = false;

    try {
      // 启动服务器
      await this.startServer();
      
      // 等待服务器就绪
      await this.waitForServerHealth();
      
      // 运行API测试
      try {
        apiSuccess = await this.runApiTests();
      } catch (error) {
        this.log(`❌ API Tests failed with error: ${error.message}`);
      }

      // 运行安全测试
      try {
        securitySuccess = await this.runSecurityTests();
      } catch (error) {
        this.log(`❌ Security Tests failed with error: ${error.message}`);
      }

    } catch (error) {
      this.log(`❌ Test setup failed: ${error.message}`);
    } finally {
      // 确保服务器被关闭
      await this.stopServer();
    }

    // 总结结果
    this.log('\n📊 Overall Test Results:');
    this.log(`📋 API Tests: ${apiSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    this.log(`🛡️  Security Tests: ${securitySuccess ? '✅ PASSED' : '⚠️  ISSUES DETECTED'}`);

    if (apiSuccess && securitySuccess) {
      this.log('🎉 All tests completed successfully!');
      return 0;
    } else {
      this.log('⚠️  Some tests failed or detected issues.');
      return 1;
    }
  }
}

// 主函数
async function main() {
  const runner = new TestRunner();
  
  console.log('🧪 OrionGameServer Complete Test Suite');
  console.log('This will start the server and run comprehensive tests.\n');

  // 处理中断信号
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received interrupt signal, cleaning up...');
    await runner.stopServer();
    process.exit(1);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received terminate signal, cleaning up...');
    await runner.stopServer();
    process.exit(1);
  });

  const exitCode = await runner.runAllTests();
  process.exit(exitCode);
}

// 运行主函数
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;