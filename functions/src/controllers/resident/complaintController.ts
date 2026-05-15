import { Response } from "express";
import { db, COLLECTIONS, Timestamp } from "../../config/firebase";
import { AuthenticatedRequest, Complaint } from "../../models/types";
import {
  sendSuccess, sendError, sendServerError, sendValidationError, sendNotFound,
} from "../../utils/response";
import { validate, createComplaintSchema } from "../../utils/validation";
import { writeAuditLog, AUDIT_ACTIONS } from "../../utils/auditLog";

// ── POST /api/v1/resident/complaints ──────────

export async function createComplaint(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const uid = req.user!.uid;
    const body = validate<any>(createComplaintSchema, req.body);

    // Validate linked service if provided
    if (body.linkedServiceId) {
      const svcSnap = await db.collection(COLLECTIONS.SERVICES).doc(body.linkedServiceId).get();
      if (!svcSnap.exists || svcSnap.data()?.communityId !== cid) {
        sendError(res, "VALIDATION_ERROR", "Linked service not found in this community", 422); return;
      }
    }

    const now = Timestamp.now();
    const complaint: Complaint = {
      communityId: cid,
      residentId: uid,
      linkedServiceId: body.linkedServiceId,
      title: body.title,
      description: body.description,
      category: body.category,
      priority: body.priority || "medium",
      status: "open",
      timeline: [{
        status: "open",
        changedBy: uid,
        changedByRole: "resident",
        note: "Complaint submitted",
        timestamp: now,
      }],
      createdAt: now,
      updatedAt: now,
    };

    const ref = await db.collection(COLLECTIONS.COMPLAINTS).add(complaint);

    await writeAuditLog({
      communityId: cid, performedBy: uid, role: "resident",
      actionType: AUDIT_ACTIONS.COMPLAINT_CREATED,
      entityType: COLLECTIONS.COMPLAINTS, entityId: ref.id,
      newData: { title: body.title, category: body.category },
    });

    sendSuccess(res, { complaintId: ref.id }, "Complaint submitted", 201);
  } catch (err) {
    if (err instanceof Error && err.message.includes(";")) sendValidationError(res, err.message);
    else sendServerError(res, err);
  }
}

// ── GET /api/v1/resident/complaints ───────────

export async function getMyComplaints(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const uid = req.user!.uid;
    const { status } = req.query as Record<string, string>;

    let query = db.collection(COLLECTIONS.COMPLAINTS)
      .where("communityId", "==", cid)
      .where("residentId", "==", uid);
    if (status) query = query.where("status", "==", status) as any;

    const snap = await query.orderBy("createdAt", "desc").get();
    const complaints = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    sendSuccess(res, { complaints, total: complaints.length }, "Complaints fetched");
  } catch (err) { sendServerError(res, err); }
}

// ── GET /api/v1/resident/complaints/:id ───────

export async function getMyComplaint(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const uid = req.user!.uid;

    const snap = await db.collection(COLLECTIONS.COMPLAINTS).doc(id).get();
    if (!snap.exists || snap.data()?.communityId !== cid || snap.data()?.residentId !== uid) {
      sendNotFound(res, "Complaint"); return;
    }
    sendSuccess(res, { id: snap.id, ...snap.data() }, "Complaint fetched");
  } catch (err) { sendServerError(res, err); }
}

// ── PATCH /api/v1/resident/complaints/:id/close ──

export async function closeMyComplaint(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const uid = req.user!.uid;

    const snap = await db.collection(COLLECTIONS.COMPLAINTS).doc(id).get();
    if (!snap.exists || snap.data()?.communityId !== cid || snap.data()?.residentId !== uid) {
      sendNotFound(res, "Complaint"); return;
    }

    if (snap.data()!.status === "resolved") {
      sendError(res, "VALIDATION_ERROR", "Complaint is already resolved", 400); return;
    }

    const now = Timestamp.now();
    await db.collection(COLLECTIONS.COMPLAINTS).doc(id).update({
      status: "resolved",
      timeline: [
        ...(snap.data()!.timeline || []),
        {
          status: "resolved",
          changedBy: uid,
          changedByRole: "resident",
          note: "Closed by resident",
          timestamp: now,
        },
      ],
      updatedAt: now,
    });

    sendSuccess(res, null, "Complaint closed");
  } catch (err) { sendServerError(res, err); }
}

// ── POST /api/v1/resident/complaints/:id/comment ──

export async function addComplaintComment(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const uid = req.user!.uid;
    const { comment } = req.body;

    if (!comment) { sendValidationError(res, "comment is required"); return; }

    const snap = await db.collection(COLLECTIONS.COMPLAINTS).doc(id).get();
    if (!snap.exists || snap.data()?.communityId !== cid || snap.data()?.residentId !== uid) {
      sendNotFound(res, "Complaint"); return;
    }

    const now = Timestamp.now();
    await db.collection(COLLECTIONS.COMPLAINTS).doc(id).update({
      timeline: [
        ...(snap.data()!.timeline || []),
        {
          status: snap.data()!.status,
          changedBy: uid,
          changedByRole: "resident",
          note: comment,
          timestamp: now,
        },
      ],
      updatedAt: now,
    });

    sendSuccess(res, null, "Comment added");
  } catch (err) { sendServerError(res, err); }
}
