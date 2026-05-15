import { db, COLLECTIONS, Timestamp, FieldValue } from "../config/firebase";
import { ServiceLog, OccupancySnapshot } from "../models/types";
import { writeAuditLog, AUDIT_ACTIONS } from "./auditLog";

/**
 * Performs a transactional check-in for a resident.
 * - Creates serviceLog entry
 * - Increments currentOccupancy on the service document
 * - Writes audit log
 */
export async function residentCheckIn(
  communityId: string,
  serviceId: string,
  residentId: string
): Promise<void> {
  const serviceRef = db.collection(COLLECTIONS.SERVICES).doc(serviceId);

  await db.runTransaction(async (transaction) => {
    const serviceSnap = await transaction.get(serviceRef);
    if (!serviceSnap.exists) throw new Error("Service not found");

    const service = serviceSnap.data()!;
    if (service.communityId !== communityId) {
      throw new Error("Community scope mismatch");
    }
    if (service.status !== "active") {
      throw new Error("Service is not currently active");
    }
    if (service.currentOccupancy >= service.maxCapacity) {
      throw new Error("Service is at full capacity");
    }

    // Log entry
    const logRef = db.collection(COLLECTIONS.SERVICE_LOGS).doc();
    const log: ServiceLog = {
      communityId,
      serviceId,
      residentId,
      actionType: "check_in",
      timestamp: Timestamp.now(),
    };
    transaction.set(logRef, log);

    // Increment occupancy
    transaction.update(serviceRef, {
      currentOccupancy: FieldValue.increment(1),
      updatedAt: Timestamp.now(),
    });
  });

  // Audit (non-transactional, fire-and-forget)
  await writeAuditLog({
    communityId,
    performedBy: residentId,
    role: "resident",
    actionType: AUDIT_ACTIONS.OCCUPANCY_CHECKIN,
    entityType: COLLECTIONS.SERVICES,
    entityId: serviceId,
    newData: { residentId },
  });
}

/**
 * Performs a transactional check-out for a resident.
 */
export async function residentCheckOut(
  communityId: string,
  serviceId: string,
  residentId: string
): Promise<void> {
  const serviceRef = db.collection(COLLECTIONS.SERVICES).doc(serviceId);

  await db.runTransaction(async (transaction) => {
    const serviceSnap = await transaction.get(serviceRef);
    if (!serviceSnap.exists) throw new Error("Service not found");

    const service = serviceSnap.data()!;
    if (service.communityId !== communityId) {
      throw new Error("Community scope mismatch");
    }

    const logRef = db.collection(COLLECTIONS.SERVICE_LOGS).doc();
    const log: ServiceLog = {
      communityId,
      serviceId,
      residentId,
      actionType: "check_out",
      timestamp: Timestamp.now(),
    };
    transaction.set(logRef, log);

    const newOccupancy = Math.max(0, service.currentOccupancy - 1);
    transaction.update(serviceRef, {
      currentOccupancy: newOccupancy,
      updatedAt: Timestamp.now(),
    });
  });

  await writeAuditLog({
    communityId,
    performedBy: residentId,
    role: "resident",
    actionType: AUDIT_ACTIONS.OCCUPANCY_CHECKOUT,
    entityType: COLLECTIONS.SERVICES,
    entityId: serviceId,
    newData: { residentId },
  });
}

/**
 * Admin manual occupancy adjustment.
 */
export async function adminAdjustOccupancy(
  communityId: string,
  serviceId: string,
  adminId: string,
  newOccupancy: number,
  note?: string
): Promise<void> {
  const serviceRef = db.collection(COLLECTIONS.SERVICES).doc(serviceId);

  let previousOccupancy = 0;
  await db.runTransaction(async (transaction) => {
    const serviceSnap = await transaction.get(serviceRef);
    if (!serviceSnap.exists) throw new Error("Service not found");

    const service = serviceSnap.data()!;
    if (service.communityId !== communityId) {
      throw new Error("Community scope mismatch");
    }
    previousOccupancy = service.currentOccupancy;

    const logRef = db.collection(COLLECTIONS.SERVICE_LOGS).doc();
    const log: ServiceLog = {
      communityId,
      serviceId,
      residentId: adminId,
      actionType: "admin_adjustment",
      timestamp: Timestamp.now(),
      adjustedBy: adminId,
      note,
    };
    transaction.set(logRef, log);

    transaction.update(serviceRef, {
      currentOccupancy: newOccupancy,
      updatedAt: Timestamp.now(),
    });
  });

  await writeAuditLog({
    communityId,
    performedBy: adminId,
    role: "admin",
    actionType: AUDIT_ACTIONS.OCCUPANCY_ADMIN_ADJUSTED,
    entityType: COLLECTIONS.SERVICES,
    entityId: serviceId,
    previousData: { currentOccupancy: previousOccupancy },
    newData: { currentOccupancy: newOccupancy, note },
  });
}

/**
 * Takes a snapshot of current occupancy for all services in a community.
 * Called by Cloud Scheduler.
 */
export async function createOccupancySnapshots(): Promise<void> {
  const servicesSnap = await db
    .collection(COLLECTIONS.SERVICES)
    .where("status", "==", "active")
    .get();

  const batch = db.batch();
  const now = Timestamp.now();

  for (const doc of servicesSnap.docs) {
    const service = doc.data();
    const snapshot: OccupancySnapshot = {
      communityId: service.communityId,
      serviceId: doc.id,
      occupancyCount: service.currentOccupancy,
      timestamp: now,
    };
    const snapRef = db.collection(COLLECTIONS.OCCUPANCY_SNAPSHOTS).doc();
    batch.set(snapRef, snapshot);
  }

  await batch.commit();
}
