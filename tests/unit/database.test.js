const { sequelize, testConnection } = require('../../src/config/database');

describe('Database Configuration', () => {
  afterAll(async () => {
    await sequelize.close();
  });

  test('should connect to MySQL database successfully', async () => {
    const isConnected = await testConnection();
    expect(isConnected).toBe(true);
  });

  test('should have correct database name', () => {
    const dbName = sequelize.config.database;
    expect(dbName).toBeDefined();
    expect(typeof dbName).toBe('string');
  });

  test('should have connection pool configured', () => {
    const { pool } = sequelize.config;
    expect(pool).toBeDefined();
    expect(pool.max).toBe(10);
    expect(pool.min).toBe(2);
  });

  test('should handle connection errors gracefully', async () => {
    const { Sequelize } = require('sequelize');
    
    // Create sequelize with wrong credentials
    const badSequelize = new Sequelize('wrong_db', 'wrong_user', 'wrong_pass', {
      host: 'localhost',
      dialect: 'mysql',
      logging: false,
    });

    await expect(badSequelize.authenticate()).rejects.toThrow();
    await badSequelize.close();
  });
});
