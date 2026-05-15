import { Request, Response } from "express";
import * as bcrypt from "bcryptjs";
import { auth, db, COLLECTIONS, Timestamp } from "../config/firebase";
import { sendSuccess, sendError, sendServerError, sendValidationError } from "../utils/response";
import { validate, loginSchema, registerRequestSchema } from "../utils/validation";
import { writeAuditLog, AUDIT_ACTIONS } from "../utils/auditLog";
import { User } from "../models/types";

// ── POST /api/v1/auth/login ───────────────────

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const body = validate<{ phone: string; password?: string; otp?: string }>(
      loginSchema,
      req.body
    );

    // Find user by phone within the community (phone is globally unique per platform in this model)
    const userSnap = await db
      .collection(COLLECTIONS.USERS)
      .where("phone", "==", body.phone)
      .limit(1)
      .get();

    if (userSnap.empty) {
      sendError(res, "AUTH_ERROR", "Invalid credentials", 401);
      return;
    }

    const userDoc = userSnap.docs[0];
    const user = userDoc.data() as User;

    if (user.status === "suspended") {
      sendError(res, "AUTH_ERROR", "Account is suspended. Contact your community admin.", 403);
      return;
    }
    if (user.status === "blacklisted") {
      sendError(res, "AUTH_ERROR", "Account has been blacklisted.", 403);
      return;
    }
    if (user.status === "pending") {
      sendError(res, "AUTH_ERROR", "Account is awaiting approval.", 403);
      return;
    }
    if (user.status === "inactive") {
      sendError(res, "AUTH_ERROR", "Account is inactive.", 403);
      return;
    }

    // Password authentication
    if (body.password) {
      if (!user.passwordHash) {
        sendError(res, "AUTH_ERROR", "Password login not configured for this account", 401);
        return;
      }
      const valid = await bcrypt.compare(body.password, user.passwordHash);
      if (!valid) {
        sendError(res, "AUTH_ERROR", "Invalid credentials", 401);
        return;
      }
    } else if (body.otp) {
      // OTP flow: verify the Firebase custom token or OTP session
      // In production, OTP is verified on client with Firebase Phone Auth
      // The client sends ID token after OTP verification; not raw OTP
      // This route is a fallback for server-side verification
      sendError(res, "AUTH_ERROR", "OTP verification must be done client-side via Firebase Phone Auth", 400);
      return;
    }

    // Generate Firebase custom token (returned to client to exchange for ID token)
    const customToken = await auth.createCustomToken(userDoc.id, {
      role: user.role,
      communityId: user.communityId,
    });

    sendSuccess(res, {
      customToken,
      role: user.role,
      communityId: user.communityId,
      userProfile: {
        id: userDoc.id,
        name: user.name,
        phone: user.phone,
        block: user.block,
        floor: user.floor,
        houseNumber: user.houseNumber,
        status: user.status,
        assignedServiceIds: user.assignedServiceIds,
        permissions: user.permissions,
      },
    }, "Login successful");
  } catch (err) {
    if (err instanceof Error && err.message.includes(";")) {
      sendValidationError(res, err.message);
    } else {
      sendServerError(res, err);
    }
  }
}

// ── POST /api/v1/auth/register-request ────────

export async function registerRequest(req: Request, res: Response): Promise<void> {
  try {
    const body = validate<{
      phone: string;
      name: string;
      communityId: string;
      block: string;
      floor?: string;
      houseNumber: string;
    }>(registerRequestSchema, req.body);

    // Check community exists
    const communitySnap = await db
      .collection(COLLECTIONS.COMMUNITIES)
      .doc(body.communityId)
      .get();

    if (!communitySnap.exists) {
      sendError(res, "RESOURCE_NOT_FOUND", "Community not found", 404);
      return;
    }

    // Check phone uniqueness within the community
    const existingSnap = await db
      .collection(COLLECTIONS.USERS)
      .where("communityId", "==", body.communityId)
      .where("phone", "==", body.phone)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      sendError(res, "CONFLICT_ERROR", "Phone number already registered in this community", 409);
      return;
    }

    const now = Timestamp.now();
    const newUser: User = {
      communityId: body.communityId,
      name: body.name,
      phone: body.phone,
      role: "resident",
      status: "pending",
      block: body.block,
      floor: body.floor,
      houseNumber: body.houseNumber,
      createdAt: now,
      updatedAt: now,
    };

    // Create Firebase Auth user
    const firebaseUser = await auth.createUser({
      phoneNumber: body.phone.startsWith("+") ? body.phone : `+${body.phone}`,
      displayName: body.name,
    });

    // Save user profile in Firestore using Firebase Auth UID
    await db.collection(COLLECTIONS.USERS).doc(firebaseUser.uid).set(newUser);

    // Set custom claims
    await auth.setCustomUserClaims(firebaseUser.uid, {
      role: "resident",
      communityId: body.communityId,
    });

    await writeAuditLog({
      communityId: body.communityId,
      performedBy: firebaseUser.uid,
      role: "resident",
      actionType: AUDIT_ACTIONS.RESIDENT_REQUEST_SUBMITTED,
      entityType: COLLECTIONS.USERS,
      entityId: firebaseUser.uid,
      newData: { name: body.name, phone: body.phone, status: "pending" },
    });

    sendSuccess(res, { requestStatus: "pending", userId: firebaseUser.uid },
      "Join request submitted. Awaiting SuperAdmin approval.", 201);
  } catch (err: any) {
    if (err.code === "auth/phone-number-already-exists") {
      sendError(res, "CONFLICT_ERROR", "Phone number already in use", 409);
    } else if (err instanceof Error && err.message.includes(";")) {
      sendValidationError(res, err.message);
    } else {
      sendServerError(res, err);
    }
  }
}

// ── POST /api/v1/auth/verify-token ────────────

export async function verifyToken(req: Request, res: Response): Promise<void> {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      sendValidationError(res, "idToken is required");
      return;
    }

    const decoded = await auth.verifyIdToken(idToken);
    const userSnap = await db.collection(COLLECTIONS.USERS).doc(decoded.uid).get();

    if (!userSnap.exists) {
      sendError(res, "AUTH_ERROR", "User profile not found", 404);
      return;
    }

    const user = userSnap.data()!;
    sendSuccess(res, {
      uid: decoded.uid,
      role: user.role,
      communityId: user.communityId,
      status: user.status,
    }, "Token is valid");
  } catch (err) {
    sendError(res, "AUTH_ERROR", "Invalid or expired token", 401);
  }
}
