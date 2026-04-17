import express from 'express';
import { processFactCheck } from '../controllers/factCheckController.js';

import { translateClaimMiddleware } from '../middleware/translationMiddleware.js';

const router = express.Router();

router.post('/', translateClaimMiddleware, processFactCheck);

export default router;
