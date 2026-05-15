import { Response } from "express";
import { db, COLLECTIONS, Timestamp } from "../../config/firebase";
import { AuthenticatedRequest, ComplaintTimelineEntry } from "../../models/types";
import {
  sendSuccess, sendServerError, sendValidationError, sendNotFound,
} from "../../utils/response";
import { validate, complainStatusSchema } from "../../utils/validation";
import { writeAuditLog, AUDIT_ACTIONS } from "../../utils/auditLog";

// ── GET /api/v1/superadmin/complaints ─────────

export async function getComplaints(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const { status, category, serviceId } = req.query as Record<string, string>;

    let query = db.collection(COLLECTIONS.COMPLAINTS).where("communityId", "==", cid);
    if (status) query = query.where("status", "==", status) as any;
    if (category) query = query.where("category", "==", category) as any;
    if (serviceId) query = query.where("linkedServiceId", "==", serviceId) as any;

    const snap = await query.orderBy("createdAt", "desc").get();
    const complaints = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    sendSuccess(res, { complaints, total: complaints.length }, "Complaints fetched");
  } catch (err) { sendServerError(res, err); }
}

// ── GET /api/v1/superadmin/complaints/:id ─────

export async function getComplaint(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const snap = await db.collection(COLLECTIONS.COMPLAINTS).doc(id).get();
    if (!snap.exists || snap.data()?.communityId !== cid) { sendNotFound(res, "Complaint"); return; }
    sendSuccess(res, { id: snap.id, ...snap.data() }, "Complaint fetched");
  } catch (err) { sendServerError(res, err); }
}

// ── PATCH /api/v1/superadmin/complaints/:id/status ──

export async function updateComplaintStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const body = validate<{ status: string; note?: string }>(complainStatusSchema, req.body);

    const snap = await db.collection(COLLECTIONS.COMPLAINTS).doc(id).get();
    if (!snap.exists || snap.data()?.communityId !== cid) { sendNotFound(res, "Complaint"); return; }

    const prev = snap.data()!;
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
      timeline: [...(prev.timeline || []), newEntry],
      updatedAt: now,
    });

    await writeAuditLog({
      communityId: cid, performedBy: req.user!.uid, role: req.user!.role,
      actionType: AUDIT_ACTIONS.COMPLAINT_STATUS_CHANGED,
      entityType: COLLECTIONS.COMPLAINTS, entityId: id,
      previousData: { status: prev.status },
      newData: { status: body.status, note: body.note },
    });

    sendSuccess(res, null, `Complaint status updated to ${body.status}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes(";")) sendValidationError(res, err.message);
    else sendServerError(res, err);
  }
}
