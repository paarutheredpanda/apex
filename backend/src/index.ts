import express from "express";
import cors from "cors";
import dotenv from "dotenv";

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

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    status: "online",
    message: "Apex Backend API is running smoothly!",
  });
});

app.use("/health", healthRoutes);
app.use("/projects", projectRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});