import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import { errorHandler } from "./middleware/errorHandler";
import healthRoutes from "./routes/health";
import projectRoutes from "./routes/projects";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

const allowedOrigin = process.env.ALLOWED_ORIGIN;

app.use(
  cors({
    origin: allowedOrigin ?? true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Health check before Clerk so it never depends on auth context
app.use("/health", healthRoutes);

// Initializes Clerk auth context on every request — required for getAuth() and requireAuth()
app.use(clerkMiddleware() as any);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.status(200).json({ status: "online", message: "Apex Backend API is running." });
});

app.use("/projects", projectRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
