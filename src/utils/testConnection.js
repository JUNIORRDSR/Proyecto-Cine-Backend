const { sequelize, testConnection } = require('../config/database');

const runTest = async () => {
  console.log('🔄 Testing database connection...');
  
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('🎉 Connection test passed!');
    console.log(`📊 Database: ${process.env.DB_NAME}`);
    console.log(`🏠 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    await sequelize.close();
    process.exit(0);
  } else {
    console.log('❌ Connection test failed!');
    console.log('Please check:');
    console.log('  1. MySQL Docker container is running');
    console.log('  2. Database credentials in .env are correct');
    console.log('  3. Port 3306 is not occupied by another service');
    await sequelize.close();
    process.exit(1);
  }
};

runTest();
