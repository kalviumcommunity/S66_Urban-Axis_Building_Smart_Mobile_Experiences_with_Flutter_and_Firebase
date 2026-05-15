import { Response } from "express";
import { db, COLLECTIONS } from "../../config/firebase";
import { AuthenticatedRequest } from "../../models/types";
import { sendSuccess, sendError, sendServerError, sendNotFound } from "../../utils/response";
import { residentCheckIn, residentCheckOut } from "../../utils/occupancy";

// ── GET /api/v1/resident/services ─────────────

export async function getResidentServices(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const userSnap = await db.collection(COLLECTIONS.USERS).doc(req.user!.uid).get();
    const userBlock = userSnap.data()?.block;

    const snap = await db
      .collection(COLLECTIONS.SERVICES)
      .where("communityId", "==", cid)
      .where("visibilitySettings.isVisible", "==", true)
      .get();

    const services = snap.docs
      .map((d) => {
        const s = d.data();
        // Check block restriction
        const restricted: string[] | undefined = s.visibilitySettings?.restrictedToBlocks;
        if (restricted && restricted.length > 0 && userBlock && !restricted.includes(userBlock)) {
          return null;
        }
        return {
          id: d.id,
          name: s.name,
          type: s.type,
          description: s.description,
          status: s.status,
          currentOccupancy: s.currentOccupancy,
          maxCapacity: s.maxCapacity,
          availableSlots: Math.max(0, s.maxCapacity - s.currentOccupancy),
          operatingDays: s.operatingDays,
          operatingHours: s.operatingHours,
          location: s.location,
          rules: s.rules,
          maintenanceSchedule: s.maintenanceSchedule,
        };
      })
      .filter(Boolean);

    sendSuccess(res, { services, total: services.length }, "Services fetched");
  } catch (err) { sendServerError(res, err); }
}

// ── GET /api/v1/resident/services/:id ─────────

export async function getResidentService(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const snap = await db.collection(COLLECTIONS.SERVICES).doc(id).get();

    if (!snap.exists || snap.data()?.communityId !== cid) { sendNotFound(res, "Service"); return; }

    const s = snap.data()!;
    if (!s.visibilitySettings?.isVisible) { sendNotFound(res, "Service"); return; }

    // Fetch active notices
    const noticesSnap = await db
      .collection(COLLECTIONS.SERVICE_NOTICES)
      .where("serviceId", "==", id)
      .where("isActive", "==", true)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const notices = noticesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    sendSuccess(res, {
      id: snap.id,
      name: s.name,
      type: s.type,
      description: s.description,
      status: s.status,
      currentOccupancy: s.currentOccupancy,
      maxCapacity: s.maxCapacity,
      availableSlots: Math.max(0, s.maxCapacity - s.currentOccupancy),
      operatingDays: s.operatingDays,
      operatingHours: s.operatingHours,
      location: s.location,
      rules: s.rules,
      maintenanceSchedule: s.maintenanceSchedule,
      activeNotices: notices,
    }, "Service details fetched");
  } catch (err) { sendServerError(res, err); }
}

// ── POST /api/v1/resident/services/:id/check-in ──

export async function checkIn(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const uid = req.user!.uid;

    await residentCheckIn(cid, id, uid);

    // Return updated occupancy
    const svcSnap = await db.collection(COLLECTIONS.SERVICES).doc(id).get();
    const s = svcSnap.data()!;

    sendSuccess(res, {
      serviceId: id,
      currentOccupancy: s.currentOccupancy,
      maxCapacity: s.maxCapacity,
      availableSlots: Math.max(0, s.maxCapacity - s.currentOccupancy),
    }, "Checked in successfully");
  } catch (err: any) {
    if (err.message?.includes("not currently active")) {
      sendError(res, "VALIDATION_ERROR", err.message, 400);
    } else if (err.message?.includes("full capacity")) {
      sendError(res, "VALIDATION_ERROR", "Service is at full capacity", 400);
    } else {
      sendServerError(res, err);
    }
  }
}

// ── POST /api/v1/resident/services/:id/check-out ──

export async function checkOut(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const cid = req.user!.communityId;
    const uid = req.user!.uid;

    await residentCheckOut(cid, id, uid);

    const svcSnap = await db.collection(COLLECTIONS.SERVICES).doc(id).get();
    const s = svcSnap.data()!;

    sendSuccess(res, {
      serviceId: id,
      currentOccupancy: s.currentOccupancy,
      maxCapacity: s.maxCapacity,
      availableSlots: Math.max(0, s.maxCapacity - s.currentOccupancy),
    }, "Checked out successfully");
  } catch (err) { sendServerError(res, err); }
}
