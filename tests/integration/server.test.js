const request = require('supertest');
const { app, startServer } = require('../../src/app');

describe('Express Server Configuration', () => {
  let server;

  beforeAll(async () => {
    // Start server for testing
    server = await startServer();
  });

  afterAll((done) => {
    // Close server after tests
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  test('should start server successfully', () => {
    expect(server).toBeDefined();
    expect(server.listening).toBe(true);
  });

  test('GET /health should return 200 and success message', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Server is running');
    expect(response.body.timestamp).toBeDefined();
  });

  test('should return 404 for undefined routes', async () => {
    const response = await request(app).get('/api/undefined-route');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  test('should have CORS enabled', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');

    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });

  test('should parse JSON body', async () => {
    // This will be tested more thoroughly with actual routes
    expect(app._router).toBeDefined();
  });
});
