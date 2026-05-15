import { Router } from "express";
import { login, registerRequest, verifyToken } from "../controllers/authController";

const router = Router();

// POST /api/v1/auth/login
router.post("/login", login);

// POST /api/v1/auth/register-request
router.post("/register-request", registerRequest);

// POST /api/v1/auth/verify-token
router.post("/verify-token", verifyToken);

export default router;
