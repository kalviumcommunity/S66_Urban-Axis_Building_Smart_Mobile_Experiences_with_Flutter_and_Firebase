import { Response } from "express";
import { db, COLLECTIONS } from "../../config/firebase";
import { AuthenticatedRequest } from "../../models/types";
import { sendSuccess, sendServerError, sendNotFound } from "../../utils/response";

// ── GET /api/v1/superadmin/profile ────────────

export async function getProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const uid = req.user!.uid;
    const snap = await db.collection(COLLECTIONS.USERS).doc(uid).get();
    if (!snap.exists) {
      sendNotFound(res, "Profile");
      return;
    }

    const { ...data } = snap.data() as any;
    sendSuccess(res, { id: snap.id, ...data }, "Profile fetched");
  } catch (err) {
    sendServerError(res, err);
  }
}

// ── GET /api/v1/superadmin/preferences ────────

export async function getPreferences(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const uid = req.user!.uid;
    const snap = await db.collection(COLLECTIONS.USERS).doc(uid).get();
    if (!snap.exists) {
      sendNotFound(res, "Preferences");
      return;
    }

    const data = snap.data() as any;
    const defaults = {
      language: "English (US)",
      pushNotifications: true,
      twoFactorAuth: true,
      activeSessions: 1,
    };

    const preferences = { ...defaults, ...(data.preferences ?? {}) };
    sendSuccess(res, preferences, "Preferences fetched");
  } catch (err) {
    sendServerError(res, err);
  }
}
