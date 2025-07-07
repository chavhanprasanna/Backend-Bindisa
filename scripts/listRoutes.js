import expressListEndpoints from 'express-list-endpoints';
import app from '../src/app.js';

const endpoints = expressListEndpoints(app);
console.table(
  endpoints.map(({ path, methods }) => ({ METHODS: methods.join(','), PATH: path }))
);
