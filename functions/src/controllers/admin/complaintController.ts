import { Response } from "express";
import { db, COLLECTIONS, Timestamp } from "../../config/firebase";
import { AuthenticatedRequest, ComplaintTimelineEntry } from "../../models/types";
import {
  sendSuccess, sendServerError, sendValidationError, sendNotFound,
} from "../../utils/response";
import { validate, complainStatusSchema } from "../../utils/validation";
import { writeAuditLog, AUDIT_ACTIONS } from "../../utils/auditLog";

// ── GET /api/v1/admin/complaints ──────────────

export async function getAdminComplaints(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const { serviceId, status } = req.query as Record<string, string>;
    const assignedIds = req.user!.assignedServiceIds || [];

    // Admin can only see complaints for their assigned services
    const filterServiceId = serviceId || (assignedIds.length === 1 ? assignedIds[0] : undefined);

    let query = db.collection(COLLECTIONS.COMPLAINTS).where("communityId", "==", cid);

    if (filterServiceId) {
      if (!assignedIds.includes(filterServiceId)) {
        sendSuccess(res, { complaints: [], total: 0 }, "No complaints");
        return;
      }
      query = query.where("linkedServiceId", "==", filterServiceId) as any;
    } else if (assignedIds.length > 0) {
      // Firestore `in` supports up to 30 items
      const batch = assignedIds.slice(0, 30);
      query = query.where("linkedServiceId", "in", batch) as any;
    }

    if (status) query = query.where("status", "==", status) as any;

    const snap = await query.orderBy("createdAt", "desc").get();
    const complaints = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    sendSuccess(res, { complaints, total: complaints.length }, "Complaints fetched");
  } catch (err) { sendServerError(res, err); }
}

// ── PATCH /api/v1/admin/complaints/:id/status ──

export async function updateAdminComplaintStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const body = validate<{ status: string; note?: string }>(complainStatusSchema, req.body);

    const snap = await db.collection(COLLECTIONS.COMPLAINTS).doc(id).get();
    if (!snap.exists || snap.data()?.communityId !== cid) { sendNotFound(res, "Complaint"); return; }

    const complaint = snap.data()!;
    // Ensure the complaint is linked to one of admin's services
    const assignedIds = req.user!.assignedServiceIds || [];
    if (complaint.linkedServiceId && !assignedIds.includes(complaint.linkedServiceId)) {
      sendSuccess(res, null, "Not your service complaint"); return;
    }

    const now = Timestamp.now();
    const newEntry: ComplaintTimelineEntry = {
      status: body.status as any,
      changedBy: req.user!.uid,
      changedByRole: req.user!.role,
      note: body.note,
      timestamp: now,
    };

    await db.collection(COLLECTIONS.COMPLAINTS).doc(id).update({
      status: body.status,
      timeline: [...(complaint.timeline || []), newEntry],
      updatedAt: now,
    });

    await writeAuditLog({
      communityId: cid, performedBy: req.user!.uid, role: req.user!.role,
      actionType: AUDIT_ACTIONS.COMPLAINT_STATUS_CHANGED,
      entityType: COLLECTIONS.COMPLAINTS, entityId: id,
      previousData: { status: complaint.status },
      newData: { status: body.status, note: body.note },
    });

    sendSuccess(res, null, `Complaint status updated to ${body.status}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes(";")) sendValidationError(res, err.message);
    else sendServerError(res, err);
  }
}

// ── PATCH /api/v1/admin/complaints/:id/note ───

export async function addInternalNote(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const { note } = req.body;
    if (!note) { sendValidationError(res, "note is required"); return; }

    const snap = await db.collection(COLLECTIONS.COMPLAINTS).doc(id).get();
    if (!snap.exists || snap.data()?.communityId !== cid) { sendNotFound(res, "Complaint"); return; }

    const existing: string[] = snap.data()!.internalNotes || [];
    await db.collection(COLLECTIONS.COMPLAINTS).doc(id).update({
      internalNotes: [...existing, `[${new Date().toISOString()}] (${req.user!.uid}): ${note}`],
      updatedAt: Timestamp.now(),
    });

    sendSuccess(res, null, "Note added");
  } catch (err) { sendServerError(res, err); }
}
