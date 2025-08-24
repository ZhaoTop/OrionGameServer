const { exec } = require('child_process');
const os = require('os');

const serviceName = process.argv[2];

if (!serviceName) {
  console.log('Usage: node stop-service.js <service-name>');
  console.log('Available services: login, gateway, logic');
  process.exit(1);
}

const portMap = {
  login: 3005,
  gateway: 8080,
  logic: 3003
};

const port = portMap[serviceName];
if (!port) {
  console.log(`Unknown service: ${serviceName}`);
  console.log('Available services: login, gateway, logic');
  process.exit(1);
}

console.log(`🛑 Stopping ${serviceName} service (port ${port})...`);

function stopService() {
  const isWindows = os.platform() === 'win32';
  
  if (isWindows) {
    // Windows: Find and kill process by port
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (error) {
        console.log(`❌ No ${serviceName} service running on port ${port}`);
        return;
      }
      
      const lines = stdout.split('\n');
      const pids = new Set();
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length > 4 && parts[1].includes(`:${port}`)) {
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') {
            pids.add(pid);
          }
        }
      });
      
      if (pids.size === 0) {
        console.log(`❌ No ${serviceName} service running on port ${port}`);
        return;
      }
      
      pids.forEach(pid => {
        exec(`taskkill /F /PID ${pid}`, (killError) => {
          if (killError) {
            console.log(`❌ Failed to stop process ${pid}:`, killError.message);
          } else {
            console.log(`✅ ${serviceName} service (PID: ${pid}) stopped successfully`);
          }
        });
      });
    });
  } else {
    // Unix/Linux/Mac: Find and kill process by port
    exec(`lsof -ti:${port}`, (error, stdout) => {
      if (error) {
        console.log(`❌ No ${serviceName} service running on port ${port}`);
        return;
      }
      
      const pids = stdout.trim().split('\n').filter(pid => pid);
      
      if (pids.length === 0) {
        console.log(`❌ No ${serviceName} service running on port ${port}`);
        return;
      }
      
      pids.forEach(pid => {
        exec(`kill -9 ${pid}`, (killError) => {
          if (killError) {
            console.log(`❌ Failed to stop process ${pid}:`, killError.message);
          } else {
            console.log(`✅ ${serviceName} service (PID: ${pid}) stopped successfully`);
          }
        });
      });
    });
  }
}

stopService();