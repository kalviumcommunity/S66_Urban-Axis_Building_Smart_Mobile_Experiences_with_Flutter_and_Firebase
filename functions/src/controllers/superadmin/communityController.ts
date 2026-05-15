import { Response } from "express";
import { db, COLLECTIONS, Timestamp } from "../../config/firebase";
import { AuthenticatedRequest } from "../../models/types";
import {
  sendSuccess, sendServerError, sendValidationError, sendNotFound,
} from "../../utils/response";
import { validate, communityUpdateSchema } from "../../utils/validation";
import { writeAuditLog, AUDIT_ACTIONS } from "../../utils/auditLog";

// ── GET /api/v1/superadmin/community ──────────

export async function getCommunity(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const communityId = req.user!.communityId;
    const snap = await db.collection(COLLECTIONS.COMMUNITIES).doc(communityId).get();
    if (!snap.exists) { sendNotFound(res, "Community"); return; }
    sendSuccess(res, { id: snap.id, ...snap.data() }, "Community fetched");
  } catch (err) { sendServerError(res, err); }
}

// ── PATCH /api/v1/superadmin/community ────────

export async function updateCommunity(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const communityId = req.user!.communityId;
    const updates = validate<Record<string, any>>(communityUpdateSchema, req.body);

    const prev = await db.collection(COLLECTIONS.COMMUNITIES).doc(communityId).get();
    if (!prev.exists) { sendNotFound(res, "Community"); return; }

    await db.collection(COLLECTIONS.COMMUNITIES).doc(communityId).update({
      ...updates,
      updatedAt: Timestamp.now(),
    });

    await writeAuditLog({
      communityId,
      performedBy: req.user!.uid,
      role: req.user!.role,
      actionType: AUDIT_ACTIONS.COMMUNITY_UPDATED,
      entityType: COLLECTIONS.COMMUNITIES,
      entityId: communityId,
      previousData: prev.data(),
      newData: updates,
    });

    sendSuccess(res, null, "Community updated");
  } catch (err) {
    if (err instanceof Error && err.message.includes(";")) sendValidationError(res, err.message);
    else sendServerError(res, err);
  }
}

// ── GET /api/v1/superadmin/dashboard ──────────

export async function getDashboard(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;

    const [usersSnap, servicesSnap, complaintsSnap] = await Promise.all([
      db.collection(COLLECTIONS.USERS).where("communityId", "==", cid).get(),
      db.collection(COLLECTIONS.SERVICES).where("communityId", "==", cid).get(),
      db.collection(COLLECTIONS.COMPLAINTS).where("communityId", "==", cid).get(),
    ]);

    const users = usersSnap.docs.map((d: any) => d.data());
    const services = servicesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[];
    const complaints = complaintsSnap.docs.map((d: any) => d.data());

    // Most reported service
    const serviceComplaintCount: Record<string, number> = {};
    for (const c of complaints) {
      if (c.linkedServiceId) {
        serviceComplaintCount[c.linkedServiceId] =
          (serviceComplaintCount[c.linkedServiceId] || 0) + 1;
      }
    }
    const mostReported = Object.entries(serviceComplaintCount).sort(
      (a: [string, number], b: [string, number]) => b[1] - a[1]
    )[0];
    let mostReportedService: any = null;
    if (mostReported) {
      const svc = services.find((s: any) => s.id === mostReported[0]);
      mostReportedService = svc ? { id: mostReported[0], name: svc.name, count: mostReported[1] } : null;
    }

    sendSuccess(res, {
      totalResidents: users.filter((u: any) => u.role === "resident").length,
      activeResidents: users.filter((u: any) => u.role === "resident" && u.status === "active").length,
      pendingResidents: users.filter((u: any) => u.role === "resident" && u.status === "pending").length,
      totalServices: services.length,
      activeServices: services.filter((s: any) => s.status === "active").length,
      maintenanceServices: services.filter((s: any) => s.status === "maintenance").length,
      totalAdmins: users.filter((u: any) => u.role === "admin").length,
      openComplaints: complaints.filter((c: any) => c.status === "open").length,
      inProgressComplaints: complaints.filter((c: any) => c.status === "in_progress").length,
      resolvedComplaints: complaints.filter((c: any) => c.status === "resolved").length,
      mostReportedService,
    }, "Dashboard data fetched");
  } catch (err) { sendServerError(res, err); }
}
