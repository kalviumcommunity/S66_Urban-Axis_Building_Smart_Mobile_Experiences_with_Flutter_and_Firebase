import { Response } from "express";
import * as bcrypt from "bcryptjs";
import { auth, db, COLLECTIONS, Timestamp } from "../../config/firebase";
import { AuthenticatedRequest, AdminPermissions, User } from "../../models/types";
import {
  sendSuccess, sendError, sendServerError, sendValidationError, sendNotFound,
} from "../../utils/response";
import { validate, createAdminSchema, updateAdminSchema } from "../../utils/validation";
import { writeAuditLog, AUDIT_ACTIONS } from "../../utils/auditLog";

// ── POST /api/v1/superadmin/admins ────────────

export async function createAdmin(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const body = validate<{
      phone: string; name: string; password: string;
      assignedServiceIds: string[];
      permissions?: AdminPermissions;
    }>(createAdminSchema, req.body);

    // Validate all assigned services belong to the same community
    for (const sid of body.assignedServiceIds) {
      const svcSnap = await db.collection(COLLECTIONS.SERVICES).doc(sid).get();
      if (!svcSnap.exists || svcSnap.data()?.communityId !== cid) {
        sendError(res, "VALIDATION_ERROR", `Service ${sid} not found in this community`, 422); return;
      }
    }

    const existing = await db.collection(COLLECTIONS.USERS)
      .where("communityId", "==", cid).where("phone", "==", body.phone).limit(1).get();
    if (!existing.empty) {
      sendError(res, "CONFLICT_ERROR", "Phone already registered", 409); return;
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const now = Timestamp.now();
    const firebaseUser = await auth.createUser({
      phoneNumber: body.phone.startsWith("+") ? body.phone : `+${body.phone}`,
      displayName: body.name,
    });

    const defaultPermissions: AdminPermissions = {
      canUpdateStatus: true,
      canEditTimings: false,
      canManageOccupancy: true,
      canResolveComplaints: true,
      ...body.permissions,
    };

    const adminData: User = {
      communityId: cid,
      name: body.name,
      phone: body.phone,
      passwordHash,
      role: "admin",
      status: "active",
      assignedServiceIds: body.assignedServiceIds,
      permissions: defaultPermissions,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(COLLECTIONS.USERS).doc(firebaseUser.uid).set(adminData);
    await auth.setCustomUserClaims(firebaseUser.uid, {
      role: "admin",
      communityId: cid,
    });

    // Update assignedAdminIds on each service
    const batch = db.batch();
    for (const sid of body.assignedServiceIds) {
      const svcRef = db.collection(COLLECTIONS.SERVICES).doc(sid);
      const svcSnap = await svcRef.get();
      if (svcSnap.exists) {
        const existing = svcSnap.data()!.assignedAdminIds || [];
        if (!existing.includes(firebaseUser.uid)) {
          batch.update(svcRef, {
            assignedAdminIds: [...existing, firebaseUser.uid],
            updatedAt: Timestamp.now(),
          });
        }
      }
    }
    await batch.commit();

    await writeAuditLog({
      communityId: cid, performedBy: req.user!.uid, role: req.user!.role,
      actionType: AUDIT_ACTIONS.ADMIN_CREATED,
      entityType: COLLECTIONS.USERS, entityId: firebaseUser.uid,
      newData: { name: body.name, phone: body.phone, assignedServiceIds: body.assignedServiceIds },
    });

    sendSuccess(res, { adminId: firebaseUser.uid }, "Admin created successfully", 201);
  } catch (err: any) {
    if (err.code === "auth/phone-number-already-exists") {
      sendError(res, "CONFLICT_ERROR", "Phone already in use", 409);
    } else if (err instanceof Error && err.message.includes(";")) {
      sendValidationError(res, err.message);
    } else { sendServerError(res, err); }
  }
}

// ── GET /api/v1/superadmin/admins ─────────────

export async function getAdmins(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const snap = await db
      .collection(COLLECTIONS.USERS)
      .where("communityId", "==", cid)
      .where("role", "==", "admin")
      .get();
    const admins = snap.docs.map(({ id, data }) => {
      const d = data();
      const { ...rest } = d;
      return { id, ...rest };
    });
    sendSuccess(res, { admins, total: admins.length }, "Admins fetched");
  } catch (err) { sendServerError(res, err); }
}

// ── PATCH /api/v1/superadmin/admins/:id ───────

export async function updateAdmin(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const body = validate<{
      name?: string;
      assignedServiceIds?: string[];
      permissions?: Partial<AdminPermissions>;
      status?: "active" | "inactive";
    }>(updateAdminSchema, req.body);

    const snap = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!snap.exists || snap.data()?.communityId !== cid || snap.data()?.role !== "admin") {
      sendNotFound(res, "Admin"); return;
    }

    const prevData = snap.data()!;
    const updates: Record<string, any> = { updatedAt: Timestamp.now() };
    if (body.name) updates.name = body.name;
    if (body.status) updates.status = body.status;
    if (body.permissions) {
      updates.permissions = { ...prevData.permissions, ...body.permissions };
    }

    if (body.assignedServiceIds !== undefined) {
      // Validate each service
      for (const sid of body.assignedServiceIds) {
        const svcSnap = await db.collection(COLLECTIONS.SERVICES).doc(sid).get();
        if (!svcSnap.exists || svcSnap.data()?.communityId !== cid) {
          sendError(res, "VALIDATION_ERROR", `Service ${sid} not valid`, 422); return;
        }
      }
      updates.assignedServiceIds = body.assignedServiceIds;

      // Sync service documents
      const oldIds: string[] = prevData.assignedServiceIds || [];
      const newIds: string[] = body.assignedServiceIds;
      const toAdd = newIds.filter((s) => !oldIds.includes(s));
      const toRemove = oldIds.filter((s) => !newIds.includes(s));

      const batch = db.batch();
      for (const sid of toAdd) {
        const ref = db.collection(COLLECTIONS.SERVICES).doc(sid);
        const s = await ref.get();
        if (s.exists) {
          const existing = s.data()!.assignedAdminIds || [];
          if (!existing.includes(id)) {
            batch.update(ref, { assignedAdminIds: [...existing, id], updatedAt: Timestamp.now() });
          }
        }
      }
      for (const sid of toRemove) {
        const ref = db.collection(COLLECTIONS.SERVICES).doc(sid);
        const s = await ref.get();
        if (s.exists) {
          const existing: string[] = s.data()!.assignedAdminIds || [];
          batch.update(ref, {
            assignedAdminIds: existing.filter((aid) => aid !== id),
            updatedAt: Timestamp.now(),
          });
        }
      }
      await batch.commit();
    }

    await db.collection(COLLECTIONS.USERS).doc(id).update(updates);
    await writeAuditLog({
      communityId: cid, performedBy: req.user!.uid, role: req.user!.role,
      actionType: AUDIT_ACTIONS.ADMIN_UPDATED,
      entityType: COLLECTIONS.USERS, entityId: id,
      previousData: prevData, newData: updates,
    });

    sendSuccess(res, null, "Admin updated");
  } catch (err) {
    if (err instanceof Error && err.message.includes(";")) sendValidationError(res, err.message);
    else sendServerError(res, err);
  }
}

// ── GET /api/v1/superadmin/admins/:id/activity ──

export async function getAdminActivity(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;

    const snap = await db.collection(COLLECTIONS.AUDIT_LOGS)
      .where("communityId", "==", cid)
      .where("performedBy", "==", id)
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();

    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    sendSuccess(res, { logs, total: logs.length }, "Admin activity fetched");
  } catch (err) { sendServerError(res, err); }
}
