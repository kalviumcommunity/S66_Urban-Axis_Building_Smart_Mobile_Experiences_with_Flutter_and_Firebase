import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/roleCheck";

// Controllers
import { getCommunity, updateCommunity, getDashboard } from "../controllers/superadmin/communityController";
import {
  getResidents, getResident, addResident, updateResidentStatus,
  updateResident, bulkUploadResidents,
} from "../controllers/superadmin/residentController";
import {
  createAdmin, getAdmins, updateAdmin, getAdminActivity,
} from "../controllers/superadmin/adminController";
import {
  createService, getServices, getService,
  updateService, updateServiceStatus, assignAdminsToService, updateServiceVisibility,
} from "../controllers/superadmin/serviceController";
import {
  getComplaints, getComplaint, updateComplaintStatus,
} from "../controllers/superadmin/complaintController";
import { sendNotification, getNotifications } from "../controllers/superadmin/notificationController";
import { uploadDocument, getDocuments, deleteDocument } from "../controllers/superadmin/documentController";
import { getAuditLogs } from "../controllers/superadmin/auditLogController";
import { getInvoices, getBillingSummary } from "../controllers/superadmin/billingController";
import { getProfile, getPreferences } from "../controllers/superadmin/settingsController";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All superadmin routes require authentication + superadmin role
router.use(authenticate, requireRole("superadmin"));

// ── Community ────────────────────────────────
router.get("/community", getCommunity);
router.patch("/community", updateCommunity);
router.get("/dashboard", getDashboard);

// ── Profile & Preferences ───────────────────
router.get("/profile", getProfile);
router.get("/preferences", getPreferences);

// ── Residents ────────────────────────────────
router.get("/residents", getResidents);
router.post("/residents", addResident);
router.post("/residents/bulk-upload", upload.single("file"), bulkUploadResidents);
router.get("/residents/:id", getResident);
router.patch("/residents/:id", updateResident);
router.patch("/residents/:id/status", updateResidentStatus);

// ── Admins ───────────────────────────────────
router.get("/admins", getAdmins);
router.post("/admins", createAdmin);
router.patch("/admins/:id", updateAdmin);
router.get("/admins/:id/activity", getAdminActivity);

// ── Services ─────────────────────────────────
router.get("/services", getServices);
router.post("/services", createService);
router.get("/services/:id", getService);
router.patch("/services/:id", updateService);
router.patch("/services/:id/status", updateServiceStatus);
router.patch("/services/:id/assign-admins", assignAdminsToService);
router.patch("/services/:id/visibility", updateServiceVisibility);

// ── Complaints ───────────────────────────────
router.get("/complaints", getComplaints);
router.get("/complaints/:id", getComplaint);
router.patch("/complaints/:id/status", updateComplaintStatus);

// ── Notifications ────────────────────────────
router.get("/notifications", getNotifications);
router.post("/notifications", sendNotification);

// ── Documents ────────────────────────────────
router.get("/documents", getDocuments);
router.post("/documents", upload.single("file"), uploadDocument);
router.delete("/documents/:id", deleteDocument);

// ── Billing ─────────────────────────────────
router.get("/invoices", getInvoices);
router.get("/billing-summary", getBillingSummary);

// ── Audit Logs ───────────────────────────────
router.get("/audit-logs", getAuditLogs);

export default router;
