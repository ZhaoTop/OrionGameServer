const axios = require('axios');

// 简单的功能测试
async function testBasicFunctionality() {
  console.log('🧪 Running Basic Functionality Tests...');
  
  try {
    // 测试健康检查端点
    console.log('\n1. Testing Health Check...');
    const healthResponse = await axios.get('http://localhost:3005/health', { timeout: 5000 });
    console.log('✅ Health Check Response:', healthResponse.status);
    console.log('   Data:', JSON.stringify(healthResponse.data, null, 2));
    
    // 测试游客登录
    console.log('\n2. Testing Guest Login...');
    // 生成一个符合UUID格式的测试ID
    const deviceId = '12345678-1234-4123-8123-123456789abc';
    const guestResponse = await axios.post('http://localhost:3005/auth/guest-login', {
      deviceId: deviceId
    });
    console.log('✅ Guest Login Response:', guestResponse.status);
    console.log('   Token obtained:', !!guestResponse.data.data?.token);
    
    // 测试Token验证
    if (guestResponse.data.data?.token) {
      console.log('\n3. Testing Token Validation...');
      const tokenResponse = await axios.post('http://localhost:3005/auth/validate-token', {
        token: guestResponse.data.data.token
      });
      console.log('✅ Token Validation Response:', tokenResponse.status);
      console.log('   Token is valid:', tokenResponse.data.data?.valid);
    }
    
    console.log('\n🎉 All basic tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// 运行测试
testBasicFunctionality()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });