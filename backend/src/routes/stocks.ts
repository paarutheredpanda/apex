import { Router } from 'express';
import { getStockQuote } from '../controllers/stockController';

const router = Router();

router.get('/quote/:symbol', getStockQuote);

export default router;
