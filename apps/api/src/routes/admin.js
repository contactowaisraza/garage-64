
import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import { calculateEndDate } from '../utils/dateUtils.js';

const router = express.Router();

router.post('/approve-request', async (req, res) => {
  const { request_id } = req.body;
  if (!request_id) throw new Error('request_id is required');

  const request = await pb.collection('requests').getOne(request_id);
  if (!request) throw new Error('Request not found');

  await pb.collection('requests').update(request_id, {
    status: 'approved'
  });

  await pb.collection('users').update(request.user_id, {
    subscription_status: 'active',
    subscription_start_date: new Date().toISOString(),
    subscription_end_date: calculateEndDate().toISOString(),
    pending_tier_request: "",
    receipt_verified: true
  });

  res.json({ success: true });
});

export default router;
