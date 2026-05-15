import { Response } from "express";
import { db, COLLECTIONS } from "../../config/firebase";
import { AuthenticatedRequest } from "../../models/types";
import { sendSuccess, sendServerError } from "../../utils/response";

function parseAmount(amount: unknown): number {
  if (typeof amount === "number") return amount;
  if (typeof amount === "string") {
    const cleaned = amount.replace(/[^0-9.]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

// ── GET /api/v1/superadmin/invoices ───────────

export async function getInvoices(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const snap = await db
      .collection(COLLECTIONS.INVOICES)
      .where("communityId", "==", cid)
      .orderBy("createdAt", "desc")
      .get();

    const invoices = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    sendSuccess(res, { invoices, total: invoices.length }, "Invoices fetched");
  } catch (err) {
    sendServerError(res, err);
  }
}

// ── GET /api/v1/superadmin/billing-summary ────

export async function getBillingSummary(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const snap = await db
      .collection(COLLECTIONS.INVOICES)
      .where("communityId", "==", cid)
      .get();

    let totalCollected = 0;
    let pendingDues = 0;

    snap.docs.forEach((doc) => {
      const data = doc.data();
      const amount = parseAmount(data.amount);
      const status = (data.status ?? "").toString().toLowerCase();
      if (status === "paid") {
        totalCollected += amount;
      } else {
        pendingDues += amount;
      }
    });

    sendSuccess(res, { totalCollected, pendingDues }, "Billing summary fetched");
  } catch (err) {
    sendServerError(res, err);
  }
}
