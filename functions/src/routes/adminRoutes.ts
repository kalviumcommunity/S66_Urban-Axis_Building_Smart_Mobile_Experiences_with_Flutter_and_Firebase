import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRole, requireServiceScope, requirePermission } from "../middleware/roleCheck";

// Controllers
import { getAdminDashboard } from "../controllers/admin/dashboardController";
import {
  getAdminService, updateAdminServiceStatus, adjustServiceOccupancy,
  updateServiceTimings, getServiceLogs,
  createServiceNotice, getServiceNotices, updateNotice,
} from "../controllers/admin/serviceController";
import {
  getAdminComplaints, updateAdminComplaintStatus, addInternalNote,
} from "../controllers/admin/complaintController";

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireRole("admin"));

// ── Dashboard ────────────────────────────────
router.get("/dashboard", getAdminDashboard);

// ── Service Control ──────────────────────────
router.get("/services/:id", requireServiceScope, getAdminService);
router.patch("/services/:id/status",
  requireServiceScope, requirePermission("canUpdateStatus"), updateAdminServiceStatus);
router.patch("/services/:id/occupancy",
  requireServiceScope, requirePermission("canManageOccupancy"), adjustServiceOccupancy);
router.patch("/services/:id/timings",
  requireServiceScope, requirePermission("canEditTimings"), updateServiceTimings);
router.get("/services/:id/logs", requireServiceScope, getServiceLogs);

// ── Service Notices ──────────────────────────
router.post("/services/:id/notices", requireServiceScope, createServiceNotice);
router.get("/services/:id/notices", requireServiceScope, getServiceNotices);
router.patch("/notices/:noticeId", updateNotice);

// ── Complaint Handling ───────────────────────
router.get("/complaints", getAdminComplaints);
router.patch("/complaints/:id/status",
  requirePermission("canResolveComplaints"), updateAdminComplaintStatus);
router.patch("/complaints/:id/note", addInternalNote);

export default router;
