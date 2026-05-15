import { Response } from "express";
import { db, COLLECTIONS } from "../../config/firebase";
import { AuthenticatedRequest } from "../../models/types";
import { sendSuccess, sendServerError } from "../../utils/response";

// ── GET /api/v1/superadmin/audit-logs ─────────

export async function getAuditLogs(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const { entityType, performedBy, actionType, limit: limitStr } = req.query as Record<string, string>;
    const limit = Math.min(parseInt(limitStr || "50", 10), 200);

    let query = db
      .collection(COLLECTIONS.AUDIT_LOGS)
      .where("communityId", "==", cid);

    if (entityType) query = query.where("entityType", "==", entityType) as any;
    if (performedBy) query = query.where("performedBy", "==", performedBy) as any;
    if (actionType) query = query.where("actionType", "==", actionType) as any;

    const snap = await query.orderBy("timestamp", "desc").limit(limit).get();
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    sendSuccess(res, { logs, total: logs.length }, "Audit logs fetched");
  } catch (err) { sendServerError(res, err); }
}
