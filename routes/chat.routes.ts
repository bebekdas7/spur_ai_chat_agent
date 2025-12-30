import { Router } from 'express';
import { postMessage, getHistory } from '../controllers/chat.controller';

const router = Router();


router.post('/message', postMessage);
router.get('/history', getHistory);


export default router;
