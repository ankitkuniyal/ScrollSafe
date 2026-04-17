import express from 'express';
import multer from 'multer';
import { processFactCheck, processAudioFactCheck } from '../controllers/factCheckController.js';

import { translateClaimMiddleware } from '../middleware/translationMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', translateClaimMiddleware, processFactCheck);
router.post('/audio', upload.single('audio'), processAudioFactCheck, translateClaimMiddleware, processFactCheck);

export default router;
