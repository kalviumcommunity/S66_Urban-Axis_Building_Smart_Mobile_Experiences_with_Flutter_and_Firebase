import { Response } from "express";
import * as bcrypt from "bcryptjs";
import { parse } from "csv-parse/sync";
import { auth, db, COLLECTIONS, Timestamp } from "../../config/firebase";
import { AuthenticatedRequest, User } from "../../models/types";
import {
  sendSuccess, sendError, sendServerError, sendValidationError, sendNotFound,
} from "../../utils/response";
import { validate, residentStatusSchema, manualAddResidentSchema } from "../../utils/validation";
import { writeAuditLog, AUDIT_ACTIONS } from "../../utils/auditLog";

// ── GET /api/v1/superadmin/residents ──────────

export async function getResidents(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const { status, block, search } = req.query as Record<string, string>;

    let query = db
      .collection(COLLECTIONS.USERS)
      .where("communityId", "==", cid)
      .where("role", "==", "resident");

    if (status) query = query.where("status", "==", status) as any;
    if (block) query = query.where("block", "==", block) as any;

    const snap = await query.get();
    let residents = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    // Client-side search (Firestore doesn't support full-text)
    if (search) {
      const term = search.toLowerCase();
      residents = residents.filter(
        (r) =>
          r.name?.toLowerCase().includes(term) ||
          r.phone?.includes(term) ||
          r.houseNumber?.toLowerCase().includes(term)
      );
    }

    // Remove passwordHash from response
    residents = residents.map(({ passwordHash: _p, ...rest }) => rest);

    sendSuccess(res, { residents, total: residents.length }, "Residents fetched");
  } catch (err) { sendServerError(res, err); }
}

// ── GET /api/v1/superadmin/residents/:id ──────

export async function getResident(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const snap = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!snap.exists || snap.data()?.communityId !== cid) { sendNotFound(res, "Resident"); return; }
    const { ...data } = snap.data()!;
    sendSuccess(res, { id: snap.id, ...data }, "Resident fetched");
  } catch (err) { sendServerError(res, err); }
}

// ── POST /api/v1/superadmin/residents ─────────

export async function addResident(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const body = validate<{
      phone: string; name: string; block: string;
      floor?: string; houseNumber: string; password?: string;
    }>(manualAddResidentSchema, req.body);

    // Uniqueness check
    const existing = await db.collection(COLLECTIONS.USERS)
      .where("communityId", "==", cid).where("phone", "==", body.phone).limit(1).get();
    if (!existing.empty) {
      sendError(res, "CONFLICT_ERROR", "Phone already registered in this community", 409); return;
    }

    const passwordHash = body.password ? await bcrypt.hash(body.password, 10) : undefined;
    const now = Timestamp.now();
    const firebaseUser = await auth.createUser({
      phoneNumber: body.phone.startsWith("+") ? body.phone : `+${body.phone}`,
      displayName: body.name,
    });

    const userData: User = {
      communityId: cid,
      name: body.name,
      phone: body.phone,
      passwordHash,
      role: "resident",
      status: "active",
      block: body.block,
      floor: body.floor,
      houseNumber: body.houseNumber,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(COLLECTIONS.USERS).doc(firebaseUser.uid).set(userData);
    await auth.setCustomUserClaims(firebaseUser.uid, { role: "resident", communityId: cid });

    await writeAuditLog({
      communityId: cid, performedBy: req.user!.uid, role: req.user!.role,
      actionType: AUDIT_ACTIONS.RESIDENT_APPROVED,
      entityType: COLLECTIONS.USERS, entityId: firebaseUser.uid,
      newData: { name: body.name, phone: body.phone, status: "active" },
    });

    sendSuccess(res, { userId: firebaseUser.uid }, "Resident added successfully", 201);
  } catch (err: any) {
    if (err.code === "auth/phone-number-already-exists") {
      sendError(res, "CONFLICT_ERROR", "Phone already in use", 409);
    } else if (err instanceof Error && err.message.includes(";")) {
      sendValidationError(res, err.message);
    } else { sendServerError(res, err); }
  }
}

// ── PATCH /api/v1/superadmin/residents/:id/status ──

export async function updateResidentStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const body = validate<{ status: string; reason?: string }>(residentStatusSchema, req.body);

    const snap = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!snap.exists || snap.data()?.communityId !== cid) { sendNotFound(res, "Resident"); return; }

    const prev = snap.data()!.status;
    await db.collection(COLLECTIONS.USERS).doc(id).update({
      status: body.status,
      updatedAt: Timestamp.now(),
    });

    await writeAuditLog({
      communityId: cid, performedBy: req.user!.uid, role: req.user!.role,
      actionType: AUDIT_ACTIONS.RESIDENT_STATUS_CHANGED,
      entityType: COLLECTIONS.USERS, entityId: id,
      previousData: { status: prev },
      newData: { status: body.status, reason: body.reason },
    });

    sendSuccess(res, null, `Resident status updated to ${body.status}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes(";")) sendValidationError(res, err.message);
    else sendServerError(res, err);
  }
}

// ── PATCH /api/v1/superadmin/residents/:id ────

export async function updateResident(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const snap = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!snap.exists || snap.data()?.communityId !== cid) { sendNotFound(res, "Resident"); return; }

    const allowed = ["name", "block", "floor", "houseNumber", "emergencyContact", "profilePhotoUrl"];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updatedAt = Timestamp.now();

    await db.collection(COLLECTIONS.USERS).doc(id).update(updates);
    await writeAuditLog({
      communityId: cid, performedBy: req.user!.uid, role: req.user!.role,
      actionType: AUDIT_ACTIONS.RESIDENT_UPDATED,
      entityType: COLLECTIONS.USERS, entityId: id,
      previousData: snap.data(), newData: updates,
    });

    sendSuccess(res, null, "Resident updated");
  } catch (err) { sendServerError(res, err); }
}

// ── POST /api/v1/superadmin/residents/bulk-upload ──

export async function bulkUploadResidents(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    if (!req.file) { sendValidationError(res, "CSV file is required"); return; }

    const csvContent = req.file.buffer.toString("utf8");
    const records = parse(csvContent, { columns: true, skip_empty_lines: true }) as any[];

    const results = { success: 0, failed: 0, errors: [] as string[] };
    const batch = db.batch();
    const now = Timestamp.now();

    for (const row of records) {
      try {
        if (!row.phone || !row.name || !row.block || !row.houseNumber) {
          throw new Error(`Missing required fields for row: ${JSON.stringify(row)}`);
        }
        const firebaseUser = await auth.createUser({
          phoneNumber: row.phone.startsWith("+") ? row.phone : `+${row.phone}`,
          displayName: row.name,
        });

        const userRef = db.collection(COLLECTIONS.USERS).doc(firebaseUser.uid);
        const userData: User = {
          communityId: cid,
          name: row.name, phone: row.phone,
          role: "resident", status: "active",
          block: row.block, floor: row.floor,
          houseNumber: row.houseNumber,
          createdAt: now, updatedAt: now,
        };
        batch.set(userRef, userData);
        await auth.setCustomUserClaims(firebaseUser.uid, { role: "resident", communityId: cid });
        results.success++;
      } catch (rowErr: any) {
        results.failed++;
        results.errors.push(`Row (${row.phone}): ${rowErr.message}`);
      }
    }

    if (results.success > 0) await batch.commit();

    sendSuccess(res, results, `Processed ${records.length} records`, 201);
  } catch (err) { sendServerError(res, err); }
}
