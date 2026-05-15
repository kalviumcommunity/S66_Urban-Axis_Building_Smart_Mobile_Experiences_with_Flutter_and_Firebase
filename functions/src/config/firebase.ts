import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

// Firestore collection references
export const COLLECTIONS = {
  COMMUNITIES: "communities",
  USERS: "users",
  SERVICES: "services",
  SERVICE_NOTICES: "serviceNotices",
  SERVICE_LOGS: "serviceLogs",
  OCCUPANCY_SNAPSHOTS: "occupancySnapshots",
  COMPLAINTS: "complaints",
  NOTIFICATIONS: "notifications",
  DOCUMENTS: "documents",
  AUDIT_LOGS: "auditLogs",
  INVOICES: "invoices",
} as const;

export const logger = functions.logger;

// Firestore field value helpers
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
