import { Response } from "express";
import { db, COLLECTIONS, FieldValue } from "../../config/firebase";
import { AuthenticatedRequest } from "../../models/types";
import { sendSuccess, sendServerError, sendNotFound } from "../../utils/response";

// ── GET /api/v1/resident/notifications ────────

export async function getResidentNotifications(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const uid = req.user!.uid;

    // Get user block for targeted notifications
    const userSnap = await db.collection(COLLECTIONS.USERS).doc(uid).get();
    const userBlock = userSnap.data()?.block;

    const snap = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .where("communityId", "==", cid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const notifications = snap.docs
      .map((d) => {
        const n = d.data();
        // Filter by target
        if (n.targetType === "block" && n.targetReferenceId && n.targetReferenceId !== userBlock) {
          return null;
        }
        return {
          id: d.id,
          title: n.title,
          message: n.message,
          targetType: n.targetType,
          createdAt: n.createdAt,
          isRead: (n.readBy || []).includes(uid),
        };
      })
      .filter(Boolean);

    sendSuccess(res, { notifications, total: notifications.length }, "Notifications fetched");
  } catch (err) { sendServerError(res, err); }
}

// ── PATCH /api/v1/resident/notifications/:id/read ──

export async function markNotificationRead(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const uid = req.user!.uid;

    const snap = await db.collection(COLLECTIONS.NOTIFICATIONS).doc(id).get();
    if (!snap.exists || snap.data()?.communityId !== cid) { sendNotFound(res, "Notification"); return; }

    await db.collection(COLLECTIONS.NOTIFICATIONS).doc(id).update({
      readBy: FieldValue.arrayUnion(uid),
    });

    sendSuccess(res, null, "Notification marked as read");
  } catch (err) { sendServerError(res, err); }
}
