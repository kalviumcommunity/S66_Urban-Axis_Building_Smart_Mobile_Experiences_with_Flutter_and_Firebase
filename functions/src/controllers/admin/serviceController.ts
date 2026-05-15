import { Response } from "express";
import { db, COLLECTIONS, Timestamp } from "../../config/firebase";
import { AuthenticatedRequest } from "../../models/types";
import {
  sendSuccess, sendError, sendServerError, sendValidationError, sendNotFound,
} from "../../utils/response";
import { validate, serviceStatusSchema, adjustOccupancySchema, createNoticeSchema } from "../../utils/validation";
import { adminAdjustOccupancy } from "../../utils/occupancy";
import { writeAuditLog, AUDIT_ACTIONS } from "../../utils/auditLog";

// ── GET /api/v1/admin/services/:id ────────────

export async function getAdminService(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const snap = await db.collection(COLLECTIONS.SERVICES).doc(id).get();
    if (!snap.exists || snap.data()?.communityId !== cid) { sendNotFound(res, "Service"); return; }
    sendSuccess(res, { id: snap.id, ...snap.data() }, "Service fetched");
  } catch (err) { sendServerError(res, err); }
}

// ── PATCH /api/v1/admin/services/:id/status ───

export async function updateAdminServiceStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const body = validate<{ status: string; reason?: string }>(serviceStatusSchema, req.body);

    const snap = await db.collection(COLLECTIONS.SERVICES).doc(id).get();
    if (!snap.exists || snap.data()?.communityId !== cid) { sendNotFound(res, "Service"); return; }

    const prev = snap.data()!.status;
    await db.collection(COLLECTIONS.SERVICES).doc(id).update({
      status: body.status,
      updatedAt: Timestamp.now(),
    });

    await writeAuditLog({
      communityId: cid, performedBy: req.user!.uid, role: req.user!.role,
      actionType: AUDIT_ACTIONS.SERVICE_STATUS_CHANGED,
      entityType: COLLECTIONS.SERVICES, entityId: id,
      previousData: { status: prev },
      newData: { status: body.status, reason: body.reason },
    });

    sendSuccess(res, null, `Service status updated to ${body.status}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes(";")) sendValidationError(res, err.message);
    else sendServerError(res, err);
  }
}

// ── PATCH /api/v1/admin/services/:id/occupancy ──

export async function adjustServiceOccupancy(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const body = validate<{ currentOccupancy: number; note?: string }>(
      adjustOccupancySchema, req.body
    );

    // Validate new occupancy does not exceed maxCapacity
    const svcSnap = await db.collection(COLLECTIONS.SERVICES).doc(id).get();
    if (!svcSnap.exists || svcSnap.data()?.communityId !== cid) { sendNotFound(res, "Service"); return; }

    if (body.currentOccupancy > svcSnap.data()!.maxCapacity) {
      sendError(res, "VALIDATION_ERROR", "Occupancy cannot exceed max capacity", 422); return;
    }

    await adminAdjustOccupancy(cid, id, req.user!.uid, body.currentOccupancy, body.note);
    sendSuccess(res, { currentOccupancy: body.currentOccupancy }, "Occupancy updated");
  } catch (err) {
    if (err instanceof Error && err.message.includes(";")) sendValidationError(res, err.message);
    else sendServerError(res, err);
  }
}

// ── PATCH /api/v1/admin/services/:id/timings ──

export async function updateServiceTimings(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const { operatingDays, operatingHours } = req.body;

    if (!operatingDays && !operatingHours) {
      sendValidationError(res, "At least operatingDays or operatingHours must be provided"); return;
    }

    const svcSnap = await db.collection(COLLECTIONS.SERVICES).doc(id).get();
    if (!svcSnap.exists || svcSnap.data()?.communityId !== cid) { sendNotFound(res, "Service"); return; }

    const updates: Record<string, any> = { updatedAt: Timestamp.now() };
    if (operatingDays) updates.operatingDays = operatingDays;
    if (operatingHours) updates.operatingHours = operatingHours;

    await db.collection(COLLECTIONS.SERVICES).doc(id).update(updates);
    sendSuccess(res, null, "Service timings updated");
  } catch (err) { sendServerError(res, err); }
}

// ── GET /api/v1/admin/services/:id/logs ───────

export async function getServiceLogs(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 200);

    const snap = await db
      .collection(COLLECTIONS.SERVICE_LOGS)
      .where("communityId", "==", cid)
      .where("serviceId", "==", id)
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    sendSuccess(res, { logs, total: logs.length }, "Service logs fetched");
  } catch (err) { sendServerError(res, err); }
}

// ── POST /api/v1/admin/services/:id/notices ───

export async function createServiceNotice(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const body = validate<any>(createNoticeSchema, req.body);

    const svcSnap = await db.collection(COLLECTIONS.SERVICES).doc(id).get();
    if (!svcSnap.exists || svcSnap.data()?.communityId !== cid) { sendNotFound(res, "Service"); return; }

    const now = Timestamp.now();
    const notice = {
      communityId: cid,
      serviceId: id,
      title: body.title,
      message: body.message,
      createdBy: req.user!.uid,
      priority: body.priority || "normal",
      isActive: true,
      createdAt: now,
      expiresAt: body.expiresAt ? Timestamp.fromDate(new Date(body.expiresAt)) : null,
    };

    const ref = await db.collection(COLLECTIONS.SERVICE_NOTICES).add(notice);
    await writeAuditLog({
      communityId: cid, performedBy: req.user!.uid, role: req.user!.role,
      actionType: AUDIT_ACTIONS.NOTICE_CREATED,
      entityType: COLLECTIONS.SERVICE_NOTICES, entityId: ref.id,
      newData: { serviceId: id, title: body.title },
    });

    sendSuccess(res, { noticeId: ref.id }, "Notice created", 201);
  } catch (err) {
    if (err instanceof Error && err.message.includes(";")) sendValidationError(res, err.message);
    else sendServerError(res, err);
  }
}

// ── GET /api/v1/admin/services/:id/notices ────

export async function getServiceNotices(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;

    const snap = await db
      .collection(COLLECTIONS.SERVICE_NOTICES)
      .where("communityId", "==", cid)
      .where("serviceId", "==", id)
      .orderBy("createdAt", "desc")
      .get();

    const notices = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    sendSuccess(res, { notices, total: notices.length }, "Notices fetched");
  } catch (err) { sendServerError(res, err); }
}

// ── PATCH /api/v1/admin/notices/:noticeId ─────

export async function updateNotice(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { noticeId } = req.params;
    const cid = req.user!.communityId;

    const snap = await db.collection(COLLECTIONS.SERVICE_NOTICES).doc(noticeId).get();
    if (!snap.exists || snap.data()?.communityId !== cid) { sendNotFound(res, "Notice"); return; }

    const allowed = ["title", "message", "priority", "isActive", "expiresAt"];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (req.body.expiresAt) {
      updates.expiresAt = Timestamp.fromDate(new Date(req.body.expiresAt));
    }

    await db.collection(COLLECTIONS.SERVICE_NOTICES).doc(noticeId).update(updates);
    sendSuccess(res, null, "Notice updated");
  } catch (err) { sendServerError(res, err); }
}
