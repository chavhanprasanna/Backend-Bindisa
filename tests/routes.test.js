import mongoose from 'mongoose';
import request from 'supertest';
import listEndpoints from 'express-list-endpoints';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import app from '../src/app.js';

dotenv.config();

let token;
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  token = jwt.sign({ sub: 'demo-user', role: 'FARMER' }, process.env.JWT_ACCESS_SECRET);
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('🚦 All routes respond without 500', () => {
  const endpoints = listEndpoints(app);
  endpoints.forEach(({ path, methods }) => {
    methods.forEach((m) => {
      // only exercise GET routes without auth/body to keep it simple
      if (m !== 'GET') return;
      test(`${m} ${path} without token`, async () => {
        const res = await request(app)[m.toLowerCase()](path);
        // expect either public 2xx/4xx or 401 for protected
        expect([200, 400, 401, 404]).toContain(res.statusCode);
      });
      test(`${m} ${path} with token`, async () => {
        const res = await request(app)[m.toLowerCase()](path).set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).not.toBe(401);
        expect(res.statusCode).not.toBeGreaterThan(499);
      });
    });
  });
});
