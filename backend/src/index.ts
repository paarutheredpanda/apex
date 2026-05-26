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

// FIXED: Conditionally apply Clerk so it doesn't intercept public GET requests
app.use((req, res, next) => {
  // Normalize path to handle potential trailing slashes safely
  const normalPath = req.path.replace(/\/$/, "");
  
  if (
    req.method === "GET" && 
    (normalPath === "/projects" || normalPath.startsWith("/projects/"))
  ) {
    return next(); // Skip global Clerk check for public project viewing
  }
  
  // Run Clerk context exactly like before for everything else
  return (clerkMiddleware() as any)(req, res, next);
});

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