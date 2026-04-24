const request = require('supertest');
const createApp = require('../src/create-app');

describe('Health check', () => {
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
    app = createApp();
  });

  it('responde al health check', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
  });
});
