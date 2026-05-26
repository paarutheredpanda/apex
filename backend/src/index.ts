import express, { Request, Response, NextFunction } from "express";
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

// Created once — not on every request (avoids middleware instance leak)
const clerkHandler = clerkMiddleware() as any;

// Bypass Clerk for public GET /projects and GET /projects/:id only.
// This prevents the dev-browser 302 redirect for unauthenticated requests.
// Watchlist routes (/projects/:id/watchlist), POST, PATCH, DELETE all still
// go through full Clerk auth context initialization.
function conditionalClerkMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const cleanPath = req.originalUrl.split("?")[0].replace(/\/+$/, "");
  const isPublicGet =
    req.method === "GET" && /^\/projects(\/[^/]+)?$/.test(cleanPath);

  if (isPublicGet) {
    next();
    return;
  }

  clerkHandler(req, res, next);
}

app.use(conditionalClerkMiddleware);
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
