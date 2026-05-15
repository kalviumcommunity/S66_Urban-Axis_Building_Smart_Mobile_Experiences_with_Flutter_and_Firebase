import { Response, NextFunction } from "express";
import { auth, db, COLLECTIONS } from "../config/firebase";
import { AuthenticatedRequest, UserRole, AdminPermissions } from "../models/types";
import { sendUnauthorized } from "../utils/response";

/**
 * Verifies the Firebase ID token in the Authorization header.
 * Populates req.user with uid, communityId, role, phone and optionally admin fields.
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      sendUnauthorized(res, "Missing or malformed Authorization header");
      return;
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await auth.verifyIdToken(idToken, true);

    // Fetch user document from Firestore for role & community data
    const userSnap = await db
      .collection(COLLECTIONS.USERS)
      .doc(decoded.uid)
      .get();

    if (!userSnap.exists) {
      sendUnauthorized(res, "User profile not found");
      return;
    }

    const userData = userSnap.data()!;

    if (userData.status === "suspended" || userData.status === "blacklisted") {
      sendUnauthorized(res, `Account is ${userData.status}`);
      return;
    }

    if (userData.status === "pending") {
      sendUnauthorized(res, "Account is pending approval");
      return;
    }

    req.user = {
      uid: decoded.uid,
      communityId: userData.communityId,
      role: userData.role as UserRole,
      phone: userData.phone,
      assignedServiceIds: userData.assignedServiceIds ?? [],
      permissions: userData.permissions as AdminPermissions | undefined,
    };

    next();
  } catch (err: any) {
    if (err.code === "auth/id-token-expired") {
      sendUnauthorized(res, "Token has expired");
    } else if (err.code === "auth/argument-error") {
      sendUnauthorized(res, "Invalid token");
    } else {
      sendUnauthorized(res, "Authentication failed");
    }
  }
}
