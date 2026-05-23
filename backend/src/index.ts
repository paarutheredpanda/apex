import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/health', healthRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[server] running on http://localhost:${PORT}`);
});

export default app;
