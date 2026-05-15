import { db, COLLECTIONS, Timestamp } from "../config/firebase";
import { AuditLog, UserRole } from "../models/types";

export interface WriteAuditLogParams {
  communityId: string;
  performedBy: string;
  role: UserRole;
  actionType: string;
  entityType: string;
  entityId: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
}

/**
 * Writes an immutable audit log entry to Firestore.
 * Safe to call without awaiting – errors are swallowed and only logged.
 */
export async function writeAuditLog(params: WriteAuditLogParams): Promise<void> {
  const log: AuditLog = {
    communityId: params.communityId,
    performedBy: params.performedBy,
    role: params.role,
    actionType: params.actionType,
    entityType: params.entityType,
    entityId: params.entityId,
    previousData: params.previousData,
    newData: params.newData,
    timestamp: Timestamp.now(),
  };
  await db.collection(COLLECTIONS.AUDIT_LOGS).add(log);
}

// Predefined action type constants for consistency
export const AUDIT_ACTIONS = {
  // Community
  COMMUNITY_UPDATED: "COMMUNITY_UPDATED",

  // Residents
  RESIDENT_REQUEST_SUBMITTED: "RESIDENT_REQUEST_SUBMITTED",
  RESIDENT_APPROVED: "RESIDENT_APPROVED",
  RESIDENT_REJECTED: "RESIDENT_REJECTED",
  RESIDENT_STATUS_CHANGED: "RESIDENT_STATUS_CHANGED",
  RESIDENT_UPDATED: "RESIDENT_UPDATED",

  // Admins
  ADMIN_CREATED: "ADMIN_CREATED",
  ADMIN_UPDATED: "ADMIN_UPDATED",
  ADMIN_DEACTIVATED: "ADMIN_DEACTIVATED",
  ADMIN_SERVICE_ASSIGNED: "ADMIN_SERVICE_ASSIGNED",

  // Services
  SERVICE_CREATED: "SERVICE_CREATED",
  SERVICE_UPDATED: "SERVICE_UPDATED",
  SERVICE_STATUS_CHANGED: "SERVICE_STATUS_CHANGED",
  SERVICE_ADMIN_ASSIGNED: "SERVICE_ADMIN_ASSIGNED",

  // Occupancy
  OCCUPANCY_CHECKIN: "OCCUPANCY_CHECKIN",
  OCCUPANCY_CHECKOUT: "OCCUPANCY_CHECKOUT",
  OCCUPANCY_ADMIN_ADJUSTED: "OCCUPANCY_ADMIN_ADJUSTED",

  // Complaints
  COMPLAINT_CREATED: "COMPLAINT_CREATED",
  COMPLAINT_STATUS_CHANGED: "COMPLAINT_STATUS_CHANGED",

  // Notices / Notifications
  NOTICE_CREATED: "NOTICE_CREATED",
  NOTIFICATION_SENT: "NOTIFICATION_SENT",

  // Documents
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
} as const;
