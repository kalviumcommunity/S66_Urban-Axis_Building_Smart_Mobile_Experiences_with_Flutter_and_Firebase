import { Response } from "express";
import { db, COLLECTIONS } from "../../config/firebase";
import { AuthenticatedRequest } from "../../models/types";
import { sendSuccess, sendServerError } from "../../utils/response";

// ── GET /api/v1/resident/dashboard ────────────

export async function getResidentDashboard(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const uid = req.user!.uid;

    const [communitySnap, servicesSnap, complaintSnap, notifSnap] = await Promise.all([
      db.collection(COLLECTIONS.COMMUNITIES).doc(cid).get(),
      db.collection(COLLECTIONS.SERVICES)
        .where("communityId", "==", cid)
        .where("visibilitySettings.isVisible", "==", true)
        .get(),
      db.collection(COLLECTIONS.COMPLAINTS)
        .where("communityId", "==", cid)
        .where("residentId", "==", uid)
        .where("status", "in", ["open", "in_progress"])
        .get(),
      db.collection(COLLECTIONS.NOTIFICATIONS)
        .where("communityId", "==", cid)
        .orderBy("createdAt", "desc")
        .limit(5)
        .get(),
    ]);

    const services = servicesSnap.docs.map((d) => {
      const s = d.data();
      return {
        id: d.id,
        name: s.name,
        type: s.type,
        status: s.status,
        currentOccupancy: s.currentOccupancy,
        maxCapacity: s.maxCapacity,
        availableSlots: Math.max(0, s.maxCapacity - s.currentOccupancy),
        operatingHours: s.operatingHours,
        location: s.location,
      };
    });

    const activeServices = services.filter((s) => s.status === "active").length;

    const communityData = communitySnap.data();

    sendSuccess(res, {
      community: {
        name: communityData?.name,
        address: communityData?.address,
        logoUrl: communityData?.logoUrl,
        emergencyContacts: communityData?.emergencyContacts,
      },
      services,
      stats: {
        totalServices: services.length,
        activeServices,
        openComplaints: complaintSnap.size,
        recentNotifications: notifSnap.size,
      },
      recentNotifications: notifSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    }, "Dashboard loaded");
  } catch (err) { sendServerError(res, err); }
}
