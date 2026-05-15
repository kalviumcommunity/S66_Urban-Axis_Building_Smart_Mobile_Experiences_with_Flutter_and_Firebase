import { Response } from "express";
import { db, COLLECTIONS } from "../../config/firebase";
import { AuthenticatedRequest } from "../../models/types";
import { sendSuccess, sendServerError } from "../../utils/response";

// ── GET /api/v1/admin/dashboard ───────────────

export async function getAdminDashboard(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const cid = req.user!.communityId;
    const assignedServiceIds = req.user!.assignedServiceIds || [];

    if (assignedServiceIds.length === 0) {
      sendSuccess(res, { assignedServices: [], complaints: [], message: "No services assigned" }, "Dashboard loaded");
      return;
    }

    // Fetch assigned services
    const servicePromises = assignedServiceIds.map((id) =>
      db.collection(COLLECTIONS.SERVICES).doc(id).get()
    );
    const serviceSnaps = await Promise.all(servicePromises);
    const assignedServices = serviceSnaps
      .filter((s) => s.exists && s.data()?.communityId === cid)
      .map((s) => ({
        id: s.id,
        name: s.data()!.name,
        type: s.data()!.type,
        status: s.data()!.status,
        currentOccupancy: s.data()!.currentOccupancy,
        maxCapacity: s.data()!.maxCapacity,
        operatingHours: s.data()!.operatingHours,
        maintenanceSchedule: s.data()!.maintenanceSchedule,
      }));

    // Active complaints for these services
    const complaintsSnap = await db
      .collection(COLLECTIONS.COMPLAINTS)
      .where("communityId", "==", cid)
      .where("linkedServiceId", "in", assignedServiceIds.slice(0, 10)) // Firestore `in` limit
      .where("status", "in", ["open", "in_progress"])
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const pendingComplaints = complaintsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    sendSuccess(res, {
      assignedServices,
      pendingComplaints,
      totalAssignedServices: assignedServices.length,
      pendingComplaintsCount: pendingComplaints.length,
    }, "Admin dashboard loaded");
  } catch (err) { sendServerError(res, err); }
}
