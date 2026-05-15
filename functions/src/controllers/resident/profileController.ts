import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { db, storage, COLLECTIONS, Timestamp } from "../../config/firebase";
import { AuthenticatedRequest } from "../../models/types";
import {
  sendSuccess, sendServerError, sendValidationError, sendNotFound,
} from "../../utils/response";

// ── GET /api/v1/resident/profile ──────────────

export async function getProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const snap = await db.collection(COLLECTIONS.USERS).doc(req.user!.uid).get();
    if (!snap.exists) { sendNotFound(res, "Profile"); return; }
    const { ...data } = snap.data()!;
    sendSuccess(res, { id: snap.id, ...data }, "Profile fetched");
  } catch (err) { sendServerError(res, err); }
}

// ── PATCH /api/v1/resident/profile ────────────

export async function updateProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const uid = req.user!.uid;
    const { emergencyContact } = req.body;

    if (!emergencyContact) {
      sendValidationError(res, "Only emergencyContact is editable via this endpoint"); return;
    }

    await db.collection(COLLECTIONS.USERS).doc(uid).update({
      emergencyContact,
      updatedAt: Timestamp.now(),
    });

    sendSuccess(res, null, "Profile updated");
  } catch (err) { sendServerError(res, err); }
}

// ── POST /api/v1/resident/profile/photo ───────

export async function uploadProfilePhoto(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const uid = req.user!.uid;
    const cid = req.user!.communityId;

    if (!req.file) { sendValidationError(res, "Image file is required"); return; }

    const bucket = storage.bucket();
    const fileName = `communities/${cid}/profiles/${uid}_${uuidv4()}`;
    const fileRef = bucket.file(fileName);

    await fileRef.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });
    await fileRef.makePublic();

    const profilePhotoUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    await db.collection(COLLECTIONS.USERS).doc(uid).update({
      profilePhotoUrl,
      updatedAt: Timestamp.now(),
    });

    sendSuccess(res, { profilePhotoUrl }, "Profile photo uploaded");
  } catch (err) { sendServerError(res, err); }
}

// ── POST /api/v1/resident/profile/request-house-change ──

export async function requestHouseChange(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const uid = req.user!.uid;
    const cid = req.user!.communityId;
    const { newBlock, newFloor, newHouseNumber, reason } = req.body;

    if (!newBlock || !newHouseNumber) {
      sendValidationError(res, "newBlock and newHouseNumber are required"); return;
    }

    // Create a complaint-style request for SuperAdmin to review
    const ref = await db.collection(COLLECTIONS.COMPLAINTS).add({
      communityId: cid,
      residentId: uid,
      title: "House Change Request",
      description: `Request to change house to Block: ${newBlock}, Floor: ${newFloor || "N/A"}, Unit: ${newHouseNumber}. Reason: ${reason || "Not specified"}`,
      category: "house_change_request",
      priority: "medium",
      status: "open",
      timeline: [{
        status: "open",
        changedBy: uid,
        changedByRole: "resident",
        note: "House change request submitted",
        timestamp: Timestamp.now(),
      }],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    sendSuccess(res, { requestId: ref.id }, "House change request submitted. Awaiting approval.", 201);
  } catch (err) { sendServerError(res, err); }
}

// ── GET /api/v1/resident/documents ────────────

export async function getResidentDocuments(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const { category } = req.query as Record<string, string>;

    let query = db.collection(COLLECTIONS.DOCUMENTS).where("communityId", "==", cid);
    if (category) query = query.where("category", "==", category) as any;

    const snap = await query.orderBy("createdAt", "desc").get();
    const documents = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    sendSuccess(res, { documents, total: documents.length }, "Documents fetched");
  } catch (err) { sendServerError(res, err); }
}
