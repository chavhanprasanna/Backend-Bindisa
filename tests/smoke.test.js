import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import app from '../src/app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

beforeAll(async () => {
  // ensure DB connection for controllers that hit Mongo
  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('🚦 API smoke tests', () => {
  test('GET /status → 200', async () => {
    const res = await request(app).get('/status');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  test('Invalid route → 404', async () => {
    const res = await request(app).get('/non-existent');
    expect(res.statusCode).toBe(404);
  });

  test('Protected route w/o token → 401', async () => {
    const res = await request(app).get('/users/me');
    expect(res.statusCode).toBe(401);
  });

  test('Auth register with token → 200/201', async () => {
    // craft dummy JWT matching middleware expectations
    const token = jwt.sign({ sub: new mongoose.Types.ObjectId(), role: 'farmer' }, process.env.JWT_ACCESS_SECRET);

    const res = await request(app)
      .post('/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Test User', role: 'farmer' });

    expect([200, 201]).toContain(res.statusCode);
  });
});
