import { Router } from 'express';
import { LLMController } from '../controllers/llm.controller';

const router = Router();

router.post('/', LLMController.invokeLLM);

export default router;
