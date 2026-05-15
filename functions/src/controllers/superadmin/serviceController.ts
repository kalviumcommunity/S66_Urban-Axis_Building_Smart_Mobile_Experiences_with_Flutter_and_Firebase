import { Response } from "express";
import { db, COLLECTIONS, Timestamp } from "../../config/firebase";
import { AuthenticatedRequest, Service } from "../../models/types";
import {
  sendSuccess, sendError, sendServerError, sendValidationError, sendNotFound,
} from "../../utils/response";
import { validate, createServiceSchema, updateServiceSchema, serviceStatusSchema } from "../../utils/validation";
import { writeAuditLog, AUDIT_ACTIONS } from "../../utils/auditLog";

// ── POST /api/v1/superadmin/services ──────────

export async function createService(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const body = validate<any>(createServiceSchema, req.body);

    const now = Timestamp.now();
    const serviceData: Service = {
      communityId: cid,
      name: body.name,
      type: body.type,
      description: body.description || "",
      maxCapacity: body.maxCapacity,
      currentOccupancy: 0,
      status: "active",
      operatingDays: body.operatingDays,
      operatingHours: body.operatingHours,
      location: body.location,
      rules: body.rules || [],
      maintenanceSchedule: body.maintenanceSchedule,
      assignedAdminIds: [],
      visibilitySettings: body.visibilitySettings || { isVisible: true },
      createdAt: now,
      updatedAt: now,
    };

    const ref = await db.collection(COLLECTIONS.SERVICES).add(serviceData);

    await writeAuditLog({
      communityId: cid, performedBy: req.user!.uid, role: req.user!.role,
      actionType: AUDIT_ACTIONS.SERVICE_CREATED,
      entityType: COLLECTIONS.SERVICES, entityId: ref.id,
      newData: { name: body.name, type: body.type },
    });

    sendSuccess(res, { serviceId: ref.id }, "Service created", 201);
  } catch (err) {
    if (err instanceof Error && err.message.includes(";")) sendValidationError(res, err.message);
    else sendServerError(res, err);
  }
}

// ── GET /api/v1/superadmin/services ───────────

export async function getServices(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const { type, status } = req.query as Record<string, string>;

    let query = db.collection(COLLECTIONS.SERVICES).where("communityId", "==", cid);
    if (type) query = query.where("type", "==", type) as any;
    if (status) query = query.where("status", "==", status) as any;

    const snap = await query.get();
    const services = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    sendSuccess(res, { services, total: services.length }, "Services fetched");
  } catch (err) { sendServerError(res, err); }
}

// ── GET /api/v1/superadmin/services/:id ───────

export async function getService(
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

// ── PATCH /api/v1/superadmin/services/:id ─────

export async function updateService(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const snap = await db.collection(COLLECTIONS.SERVICES).doc(id).get();
    if (!snap.exists || snap.data()?.communityId !== cid) { sendNotFound(res, "Service"); return; }

    const body = validate<any>(updateServiceSchema, req.body);
    const updates = { ...body, updatedAt: Timestamp.now() };

    await db.collection(COLLECTIONS.SERVICES).doc(id).update(updates);
    await writeAuditLog({
      communityId: cid, performedBy: req.user!.uid, role: req.user!.role,
      actionType: AUDIT_ACTIONS.SERVICE_UPDATED,
      entityType: COLLECTIONS.SERVICES, entityId: id,
      previousData: snap.data(), newData: updates,
    });

    sendSuccess(res, null, "Service updated");
  } catch (err) {
    if (err instanceof Error && err.message.includes(";")) sendValidationError(res, err.message);
    else sendServerError(res, err);
  }
}

// ── PATCH /api/v1/superadmin/services/:id/status ──

export async function updateServiceStatus(
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

// ── PATCH /api/v1/superadmin/services/:id/assign-admins ──

export async function assignAdminsToService(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const { adminIds } = req.body;

    if (!Array.isArray(adminIds)) {
      sendError(res, "VALIDATION_ERROR", "adminIds must be an array", 422); return;
    }

    const svcSnap = await db.collection(COLLECTIONS.SERVICES).doc(id).get();
    if (!svcSnap.exists || svcSnap.data()?.communityId !== cid) { sendNotFound(res, "Service"); return; }

    // Validate admins are valid community admins
    for (const adminId of adminIds) {
      const adminSnap = await db.collection(COLLECTIONS.USERS).doc(adminId).get();
      if (!adminSnap.exists || adminSnap.data()?.communityId !== cid || adminSnap.data()?.role !== "admin") {
        sendError(res, "VALIDATION_ERROR", `User ${adminId} is not a valid admin in this community`, 422); return;
      }
    }

    const prev = svcSnap.data()!.assignedAdminIds || [];
    await db.collection(COLLECTIONS.SERVICES).doc(id).update({
      assignedAdminIds: adminIds,
      updatedAt: Timestamp.now(),
    });

    // Sync assignedServiceIds on each admin user
    const toAdd = adminIds.filter((a: string) => !prev.includes(a));
    const toRemove = prev.filter((a: string) => !(adminIds as string[]).includes(a));

    const batch = db.batch();
    for (const adminId of toAdd) {
      const ref = db.collection(COLLECTIONS.USERS).doc(adminId);
      const a = await ref.get();
      if (a.exists) {
        const existing: string[] = a.data()!.assignedServiceIds || [];
        if (!existing.includes(id)) {
          batch.update(ref, { assignedServiceIds: [...existing, id], updatedAt: Timestamp.now() });
        }
      }
    }
    for (const adminId of toRemove) {
      const ref = db.collection(COLLECTIONS.USERS).doc(adminId);
      const a = await ref.get();
      if (a.exists) {
        const existing: string[] = a.data()!.assignedServiceIds || [];
        batch.update(ref, {
          assignedServiceIds: existing.filter((s) => s !== id),
          updatedAt: Timestamp.now(),
        });
      }
    }
    await batch.commit();

    await writeAuditLog({
      communityId: cid, performedBy: req.user!.uid, role: req.user!.role,
      actionType: AUDIT_ACTIONS.SERVICE_ADMIN_ASSIGNED,
      entityType: COLLECTIONS.SERVICES, entityId: id,
      previousData: { assignedAdminIds: prev },
      newData: { assignedAdminIds: adminIds },
    });

    sendSuccess(res, null, "Service admins updated");
  } catch (err) { sendServerError(res, err); }
}

// ── PATCH /api/v1/superadmin/services/:id/visibility ──

export async function updateServiceVisibility(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const snap = await db.collection(COLLECTIONS.SERVICES).doc(id).get();
    if (!snap.exists || snap.data()?.communityId !== cid) { sendNotFound(res, "Service"); return; }

    const { isVisible, restrictedToBlocks } = req.body;
    const visibilitySettings: any = {};
    if (typeof isVisible === "boolean") visibilitySettings.isVisible = isVisible;
    if (Array.isArray(restrictedToBlocks)) visibilitySettings.restrictedToBlocks = restrictedToBlocks;

    await db.collection(COLLECTIONS.SERVICES).doc(id).update({
      visibilitySettings: { ...snap.data()!.visibilitySettings, ...visibilitySettings },
      updatedAt: Timestamp.now(),
    });
    sendSuccess(res, null, "Service visibility updated");
  } catch (err) { sendServerError(res, err); }
}
