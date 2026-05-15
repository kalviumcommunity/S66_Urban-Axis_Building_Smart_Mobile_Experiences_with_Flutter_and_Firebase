import { Response } from "express";
import { db, COLLECTIONS, Timestamp } from "../../config/firebase";
import { AuthenticatedRequest, Notification } from "../../models/types";
import {
  sendSuccess, sendServerError, sendValidationError,
} from "../../utils/response";
import { validate, createNotificationSchema } from "../../utils/validation";
import { writeAuditLog, AUDIT_ACTIONS } from "../../utils/auditLog";

// ── POST /api/v1/superadmin/notifications ─────

export async function sendNotification(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const body = validate<{
      title: string; message: string;
      targetType: "all" | "block" | "service";
      targetReferenceId?: string;
    }>(createNotificationSchema, req.body);

    const now = Timestamp.now();
    const notification: Notification = {
      communityId: cid,
      title: body.title,
      message: body.message,
      targetType: body.targetType,
      targetReferenceId: body.targetReferenceId,
      createdBy: req.user!.uid,
      readBy: [],
      createdAt: now,
    };

    const ref = await db.collection(COLLECTIONS.NOTIFICATIONS).add(notification);

    await writeAuditLog({
      communityId: cid, performedBy: req.user!.uid, role: req.user!.role,
      actionType: AUDIT_ACTIONS.NOTIFICATION_SENT,
      entityType: COLLECTIONS.NOTIFICATIONS, entityId: ref.id,
      newData: { title: body.title, targetType: body.targetType },
    });

    sendSuccess(res, { notificationId: ref.id }, "Notification sent", 201);
  } catch (err) {
    if (err instanceof Error && err.message.includes(";")) sendValidationError(res, err.message);
    else sendServerError(res, err);
  }
}

// ── GET /api/v1/superadmin/notifications ──────

export async function getNotifications(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const snap = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .where("communityId", "==", cid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    sendSuccess(res, { notifications, total: notifications.length }, "Notifications fetched");
  } catch (err) { sendServerError(res, err); }
}
