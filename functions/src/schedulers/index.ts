import * as functions from "firebase-functions";
import { db, COLLECTIONS, Timestamp } from "../config/firebase";
import { createOccupancySnapshots } from "../utils/occupancy";
import { logger } from "../config/firebase";

// ── Occupancy Snapshot (every hour) ──────────

export const takeOccupancySnapshot = functions.pubsub
  .schedule("every 60 minutes")
  .onRun(async (_context) => {
    try {
      await createOccupancySnapshots();
      logger.info("Occupancy snapshots created successfully");
    } catch (err) {
      logger.error("Failed to create occupancy snapshots", err);
    }
  });

// ── Expire Service Notices (daily at midnight) ──

export const expireServiceNotices = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async (_context) => {
    try {
      const now = Timestamp.now();
      const snap = await db
        .collection(COLLECTIONS.SERVICE_NOTICES)
        .where("isActive", "==", true)
        .where("expiresAt", "<=", now)
        .get();

      if (snap.empty) {
        logger.info("No notices to expire");
        return;
      }

      const batch = db.batch();
      for (const doc of snap.docs) {
        batch.update(doc.ref, { isActive: false });
      }
      await batch.commit();
      logger.info(`Expired ${snap.size} service notices`);
    } catch (err) {
      logger.error("Failed to expire service notices", err);
    }
  });

// ── Archive old Service Logs (weekly) ─────────
// Moves logs older than 90 days to an archive collection

export const archiveOldServiceLogs = functions.pubsub
  .schedule("0 2 * * 0") // Every Sunday at 2 AM
  .timeZone("Asia/Kolkata")
  .onRun(async (_context) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      const cutoff = Timestamp.fromDate(cutoffDate);

      const snap = await db
        .collection(COLLECTIONS.SERVICE_LOGS)
        .where("timestamp", "<", cutoff)
        .limit(500) // Process in batches
        .get();

      if (snap.empty) {
        logger.info("No service logs to archive");
        return;
      }

      const batch = db.batch();
      for (const doc of snap.docs) {
        const archiveRef = db.collection("serviceLogsArchive").doc(doc.id);
        batch.set(archiveRef, { ...doc.data(), archivedAt: Timestamp.now() });
        batch.delete(doc.ref);
      }
      await batch.commit();
      logger.info(`Archived ${snap.size} service logs`);
    } catch (err) {
      logger.error("Failed to archive service logs", err);
    }
  });

// ── Archive old Occupancy Snapshots (weekly) ──

export const archiveOldSnapshots = functions.pubsub
  .schedule("0 3 * * 0") // Every Sunday at 3 AM
  .timeZone("Asia/Kolkata")
  .onRun(async (_context) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      const cutoff = Timestamp.fromDate(cutoffDate);

      const snap = await db
        .collection(COLLECTIONS.OCCUPANCY_SNAPSHOTS)
        .where("timestamp", "<", cutoff)
        .limit(500)
        .get();

      if (snap.empty) { logger.info("No snapshots to archive"); return; }

      const batch = db.batch();
      for (const doc of snap.docs) {
        batch.delete(doc.ref);
      }
      await batch.commit();
      logger.info(`Deleted ${snap.size} old occupancy snapshots`);
    } catch (err) {
      logger.error("Failed to clean up old snapshots", err);
    }
  });

// ── Auto reset occupancy at midnight (safety net) ──

export const resetOccupancyAtMidnight = functions.pubsub
  .schedule("59 23 * * *") // 11:59 PM daily
  .timeZone("Asia/Kolkata")
  .onRun(async (_context) => {
    try {
      // Only reset services that are operating – not those under maintenance
      const snap = await db
        .collection(COLLECTIONS.SERVICES)
        .where("status", "==", "active")
        .get();

      const batch = db.batch();
      for (const doc of snap.docs) {
        batch.update(doc.ref, {
          currentOccupancy: 0,
          updatedAt: Timestamp.now(),
        });
      }
      await batch.commit();
      logger.info(`Reset occupancy for ${snap.size} active services`);
    } catch (err) {
      logger.error("Failed to reset occupancy", err);
    }
  });
