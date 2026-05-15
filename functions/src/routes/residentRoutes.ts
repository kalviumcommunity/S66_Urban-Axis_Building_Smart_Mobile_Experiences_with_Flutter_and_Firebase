import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/roleCheck";

// Controllers
import { getResidentDashboard } from "../controllers/resident/dashboardController";
import {
  getResidentServices, getResidentService, checkIn, checkOut,
} from "../controllers/resident/serviceController";
import {
  createComplaint, getMyComplaints, getMyComplaint,
  closeMyComplaint, addComplaintComment,
} from "../controllers/resident/complaintController";
import {
  getResidentNotifications, markNotificationRead,
} from "../controllers/resident/notificationController";
import {
  getProfile, updateProfile, uploadProfilePhoto,
  requestHouseChange, getResidentDocuments,
} from "../controllers/resident/profileController";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All resident routes require authentication + resident role
router.use(authenticate, requireRole("resident"));

// ── Dashboard ────────────────────────────────
router.get("/dashboard", getResidentDashboard);

// ── Services ─────────────────────────────────
router.get("/services", getResidentServices);
router.get("/services/:id", getResidentService);
router.post("/services/:id/check-in", checkIn);
router.post("/services/:id/check-out", checkOut);

// ── Complaints ───────────────────────────────
router.get("/complaints", getMyComplaints);
router.post("/complaints", createComplaint);
router.get("/complaints/:id", getMyComplaint);
router.patch("/complaints/:id/close", closeMyComplaint);
router.post("/complaints/:id/comment", addComplaintComment);

// ── Notifications ────────────────────────────
router.get("/notifications", getResidentNotifications);
router.patch("/notifications/:id/read", markNotificationRead);

// ── Profile ──────────────────────────────────
router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.post("/profile/photo", upload.single("photo"), uploadProfilePhoto);
router.post("/profile/request-house-change", requestHouseChange);

// ── Documents ────────────────────────────────
router.get("/documents", getResidentDocuments);

export default router;
