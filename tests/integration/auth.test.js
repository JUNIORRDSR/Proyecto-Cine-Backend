const request = require('supertest');
const { app } = require('../../src/app');
const { sequelize } = require('../../src/config/database');
const { Usuario } = require('../../src/models');

describe('Authentication API', () => {
  let adminToken;
  let cajeroToken;

  beforeAll(async () => {
    // Ensure database connection
    await sequelize.authenticate();

    // Create test users if they don't exist
    const adminExists = await Usuario.findOne({ where: { usuario: 'admin' } });
    if (!adminExists) {
      await Usuario.create({
        nombre: 'Admin Test',
        usuario: 'admin',
        contrasena: 'admin123',
        rol: 'ADMIN',
      });
    }

    const cajeroExists = await Usuario.findOne({ where: { usuario: 'cajero1' } });
    if (!cajeroExists) {
      await Usuario.create({
        nombre: 'Cajero Test',
        usuario: 'cajero1',
        contrasena: 'cajero123',
        rol: 'CAJERO',
      });
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully with valid admin credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          usuario: 'admin',
          contrasena: 'admin123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.usuario).toBe('admin');
      expect(response.body.data.user.rol).toBe('ADMIN');
      expect(response.body.data.user.contrasena).toBeUndefined(); // Password should not be returned

      adminToken = response.body.data.token;
    });

    test('should login successfully with valid cajero credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          usuario: 'cajero1',
          contrasena: 'cajero123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.rol).toBe('CAJERO');

      cajeroToken = response.body.data.token;
    });

    test('should fail with invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          usuario: 'invalid_user',
          contrasena: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          usuario: 'admin',
          contrasena: 'wrong_password',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail when usuario is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          contrasena: 'admin123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should fail when contrasena is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          usuario: 'admin',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    test('should return current user data with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.usuario).toBe('admin');
      expect(response.body.data.rol).toBe('ADMIN');
    });

    test('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /api/auth/register', () => {
    test('should register new user when authenticated as admin', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Nuevo Cajero',
          usuario: 'cajero_test',
          contrasena: 'test123',
          rol: 'CAJERO',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.usuario).toBe('cajero_test');
      expect(response.body.data.rol).toBe('CAJERO');

      // Clean up
      await Usuario.destroy({ where: { usuario: 'cajero_test' } });
    });

    test('should fail when not authenticated', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Test User',
          usuario: 'test',
          contrasena: 'test123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail when authenticated as cajero (not admin)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          nombre: 'Test User',
          usuario: 'test',
          contrasena: 'test123',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
});
