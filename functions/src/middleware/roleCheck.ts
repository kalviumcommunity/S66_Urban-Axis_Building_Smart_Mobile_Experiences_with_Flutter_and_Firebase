import { Response, NextFunction } from "express";
import { AdminPermissions, AuthenticatedRequest, UserRole } from "../models/types";
import { sendForbidden } from "../utils/response";

/**
 * Returns middleware that asserts the authenticated user has one of the
 * required roles.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendForbidden(res, "User not authenticated");
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendForbidden(
        res,
        `Access restricted to: ${roles.join(", ")}`
      );
      return;
    }
    next();
  };
}

/**
 * Validates that the requested resource belongs to the same community
 * as the authenticated user. Pass `communityIdParam` as the name of the
 * URL param or body field that holds the community id – defaults to
 * reading it from req.params.communityId.
 */
export function requireCommunityScope(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const communityIdInParam =
    req.params.communityId || req.body.communityId || req.query.communityId;

  if (communityIdInParam && req.user?.communityId !== communityIdInParam) {
    sendForbidden(res, "Cross-community access denied");
    return;
  }
  next();
}

/**
 * Validates that an admin is assigned to the service they are trying to
 * manage. The service id is expected in req.params.id or req.params.serviceId.
 */
export function requireServiceScope(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    sendForbidden(res, "User not authenticated");
    return;
  }

  // SuperAdmin has unrestricted service access within their community
  if (req.user.role === "superadmin") {
    next();
    return;
  }

  const serviceId = req.params.id || req.params.serviceId;
  if (!serviceId) {
    next();
    return;
  }

  const assigned = req.user.assignedServiceIds ?? [];
  if (!assigned.includes(serviceId)) {
    sendForbidden(res, "Admin is not assigned to this service");
    return;
  }
  next();
}

/**
 * Validates that an admin has a specific permission.
 */
export function requirePermission(
  permissionKey: keyof AdminPermissions
) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendForbidden(res);
      return;
    }
    if (req.user.role === "superadmin") {
      next();
      return;
    }
    const perms = req.user.permissions;
    if (!perms || !(perms as any)[permissionKey]) {
      sendForbidden(res, `Permission '${permissionKey}' is not granted`);
      return;
    }
    next();
  };
}
