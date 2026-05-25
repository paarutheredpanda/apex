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

const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(
  cors({
    origin: allowedOrigin ?? true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use('/health', healthRoutes);

app.use(clerkMiddleware());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/projects', projectRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[server] running on port ${PORT}`);
});

export default app;
