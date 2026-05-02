import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes/index.js';
import { errorMiddleware } from './middleware/error.js';
import { globalRateLimit } from './middleware/global-rate-limit.js';
import logger from './utils/logger.js';
import { BodyLimit } from './constants/common.js';
import { startCleanupScheduler } from './services/messageCleanupService.js';

const app = express();

app.set('trust proxy', true);

process.on('uncaughtException', (error) => {
	logger.error('=== UNCAUGHT EXCEPTION ===');
	logger.error(`Error Message: ${error.message}`);
	logger.error(`Error Stack: ${error.stack}`);
	logger.error('===');
	process.exit(1);
});
  
process.on('unhandledRejection', (reason, promise) => {
	logger.error('=== UNHANDLED REJECTION ===');
	logger.error(`Promise: ${promise}`);
	logger.error(`Reason: ${reason}`);
	if (reason instanceof Error) {
		logger.error(`Error Stack: ${reason.stack}`);
	}
	logger.error('===');
});

process.on('SIGINT', async () => {
	logger.info('Interrupted');
	process.exit(0);
});

process.on('SIGTERM', async () => {
	logger.info('SIGTERM signal received');

	await new Promise(resolve => setTimeout(resolve, 3000));

	logger.info('Exiting');
	process.exit();
});

app.use(helmet());
app.use(cors({
	origin: process.env.CORS_ORIGIN,
	credentials: true,
}));
app.use(morgan('combined'));
app.use(globalRateLimit);
app.use(express.json({
	limit: BodyLimit,
}));
app.use(express.urlencoded({ 
	extended: true,
	limit: BodyLimit,
}));

app.use('/', routes());

app.use(errorMiddleware);

app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
	logger.info(`🚀 API Server running on http://localhost:${port}`);
	startCleanupScheduler();
});

export default app;
