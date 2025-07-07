import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import farmRoutes from './routes/farm.routes.js';
import cycleRoutes from './routes/cropCycleRoutes.js';
import testRoutes from './routes/soilTestRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import bugReportRoutes from './routes/bugReportRoutes.js';
import supportChatRoutes from './routes/supportChatRoutes.js';
import cropSuggestionRoutes from './routes/cropSuggestionRoutes.js';
import profitEntryRoutes from './routes/profitEntryRoutes.js';
import offlineSyncRoutes from './routes/offlineSyncRoutes.js';
import videoTutorialRoutes from './routes/videoTutorialRoutes.js';

import errorHandler from './middlewares/errorHandler.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/status', (req, res) => res.json({ status: 'OK', timestamp: Date.now() }));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/farms', farmRoutes);
app.use('/api/v1/cycles', cycleRoutes);
app.use('/api/v1/tests', testRoutes);
app.use('/notifications', notificationRoutes);
app.use('/support/bug-reports', bugReportRoutes);
app.use('/support/chat', supportChatRoutes);
app.use('/ai/crop-suggestions', cropSuggestionRoutes);
app.use('/profit-calculator', profitEntryRoutes);
app.use('/sync', offlineSyncRoutes);
app.use('/support/tutorials', videoTutorialRoutes);

app.use('*', (req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

export default app;
