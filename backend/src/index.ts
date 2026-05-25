import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express';
import { errorHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import projectRoutes from './routes/projects';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(clerkMiddleware());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/health', healthRoutes);
app.use('/projects', projectRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[server] running on http://localhost:${PORT}`);
});

export default app;
