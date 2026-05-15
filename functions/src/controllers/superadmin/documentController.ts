import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { db, storage, COLLECTIONS, Timestamp } from "../../config/firebase";
import { AuthenticatedRequest, Document } from "../../models/types";
import {
  sendSuccess, sendServerError, sendValidationError, sendNotFound,
} from "../../utils/response";
import { writeAuditLog, AUDIT_ACTIONS } from "../../utils/auditLog";

// ── POST /api/v1/superadmin/documents ─────────

export async function uploadDocument(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const { title, category } = req.body;

    if (!title || !category) {
      sendValidationError(res, "title and category are required"); return;
    }
    if (!req.file) {
      sendValidationError(res, "PDF file is required"); return;
    }

    const bucket = storage.bucket();
    const fileName = `communities/${cid}/documents/${uuidv4()}_${req.file.originalname}`;
    const fileRef = bucket.file(fileName);

    await fileRef.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });

    await fileRef.makePublic();
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    const now = Timestamp.now();
    const doc: Document = {
      communityId: cid,
      title,
      fileUrl,
      category,
      uploadedBy: req.user!.uid,
      createdAt: now,
    };

    const ref = await db.collection(COLLECTIONS.DOCUMENTS).add(doc);

    await writeAuditLog({
      communityId: cid, performedBy: req.user!.uid, role: req.user!.role,
      actionType: AUDIT_ACTIONS.DOCUMENT_UPLOADED,
      entityType: COLLECTIONS.DOCUMENTS, entityId: ref.id,
      newData: { title, category, fileUrl },
    });

    sendSuccess(res, { documentId: ref.id, fileUrl }, "Document uploaded", 201);
  } catch (err) { sendServerError(res, err); }
}

// ── GET /api/v1/superadmin/documents ──────────

export async function getDocuments(
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

// ── DELETE /api/v1/superadmin/documents/:id ───

export async function deleteDocument(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;

    const snap = await db.collection(COLLECTIONS.DOCUMENTS).doc(id).get();
    if (!snap.exists || snap.data()?.communityId !== cid) { sendNotFound(res, "Document"); return; }

    // Delete from Storage
    const fileUrl: string = snap.data()!.fileUrl;
    const bucketName = storage.bucket().name;
    const filePath = fileUrl.replace(`https://storage.googleapis.com/${bucketName}/`, "");
    try {
      await storage.bucket().file(filePath).delete();
    } catch (_e) { /* File may already be deleted */ }

    await db.collection(COLLECTIONS.DOCUMENTS).doc(id).delete();
    sendSuccess(res, null, "Document deleted");
  } catch (err) { sendServerError(res, err); }
}
