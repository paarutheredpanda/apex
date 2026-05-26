import { Router } from 'express';
import { getStockQuote } from '../controllers/stockController';
import { getStockHistory } from '../controllers/stockHistoryController';

const router = Router();

router.get('/quote/:symbol', getStockQuote);
router.get('/history/:symbol', getStockHistory);

export default router;
