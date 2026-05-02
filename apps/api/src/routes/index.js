
import { Router } from 'express';
import healthCheck from './health-check.js';
import authRouter from './auth.js';
import adminRouter from './admin.js';
import bulkImportRouter from './bulkImport.js';
import listingsRouter from './listings.js';
import usersRouter from './users.js';
import requestsRouter from './requests.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    router.use('/auth', authRouter);
    router.use('/admin', adminRouter);
    router.use('/bulk-import-users', bulkImportRouter);
    router.use('/create-ad', listingsRouter);
    router.use('/pending-ads', listingsRouter);
    router.use('/users', usersRouter);
    router.use('/requests', requestsRouter);

    return router;
};
