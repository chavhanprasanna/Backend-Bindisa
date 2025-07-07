import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import {
  createConversation,
  listConversations,
  getMessages,
  postMessage,
} from '../controllers/supportChatController.js';

const router = Router();

router.post('/', auth(), createConversation);
router.get('/', auth(), listConversations);
router.get('/:conversationId/messages', auth(), getMessages);
router.post('/:conversationId/messages', auth(), postMessage);

export default router;
