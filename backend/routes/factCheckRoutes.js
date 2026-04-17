import express from 'express';
import multer from 'multer';
import { processFactCheck, processAudioFactCheck, processVideoFactCheck } from '../controllers/factCheckController.js';

import { translateClaimMiddleware } from '../middleware/translationMiddleware.js';

const router = express.Router();
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 30 * 1024 * 1024 } // 30MB Limit for stability
});

router.post('/', upload.single('image'), translateClaimMiddleware, processFactCheck);
router.post('/audio', upload.single('audio'), processAudioFactCheck, translateClaimMiddleware, processFactCheck);
router.post('/video', upload.single('video'), processVideoFactCheck, translateClaimMiddleware, processFactCheck);


export default router;
