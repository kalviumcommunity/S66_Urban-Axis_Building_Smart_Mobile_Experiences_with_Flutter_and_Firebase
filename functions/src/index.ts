import * as functions from "firebase-functions";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

// Routes
import authRoutes from "./routes/authRoutes";
import superadminRoutes from "./routes/superadminRoutes";
import adminRoutes from "./routes/adminRoutes";
import residentRoutes from "./routes/residentRoutes";

// Scheduled jobs
export {
  takeOccupancySnapshot,
  expireServiceNotices,
  archiveOldServiceLogs,
  archiveOldSnapshots,
  resetOccupancyAtMidnight,
} from "./schedulers/index";

// ── Express App ────────────────────────────────

const app = express();

// Security – headers
app.use(
  helmet({
    contentSecurityPolicy: false, // handled at CDN level
  })
);

// CORS – allow Flutter clients
app.use(
  cors({
    origin: true, // Restrict to your domains in production
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);

// Request logging
app.use(morgan("combined"));

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiter – per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errorCode: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests. Please try again later.",
  },
});
app.use(limiter);

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    errorCode: "RATE_LIMIT_EXCEEDED",
    message: "Too many authentication attempts. Please wait and try again.",
  },
});

// ── Route mounting ─────────────────────────────

app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/superadmin", superadminRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/resident", residentRoutes);

// ── Health check ───────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "UrbanAxis API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ── 404 handler ────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    errorCode: "RESOURCE_NOT_FOUND",
    message: "The requested endpoint does not exist",
  });
});

// ── Global error handler ───────────────────────

app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[GlobalError]", err);
    res.status(500).json({
      success: false,
      errorCode: "SERVER_ERROR",
      message: "An unexpected server error occurred",
    });
  }
);

// ── Export as Cloud Function ───────────────────

export const api = functions
  .runWith({
    timeoutSeconds: 60,
    memory: "512MB",
  })
  .https.onRequest(app);
