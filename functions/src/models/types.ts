// ─────────────────────────────────────────────
//  UrbanAxis – Shared Type Definitions
// ─────────────────────────────────────────────

import { Request } from "express";

// ── Enumerations ──────────────────────────────

export type UserRole = "superadmin" | "admin" | "resident";

export type UserStatus =
  | "pending"
  | "active"
  | "suspended"
  | "inactive"
  | "blacklisted";

export type ServiceType =
  | "gym"
  | "pool"
  | "party_hall"
  | "parking"
  | "clubhouse"
  | "sports_area";

export type ServiceStatus =
  | "active"
  | "maintenance"
  | "temporarily_closed"
  | "emergency_closed";

export type ComplaintStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "rejected";

export type ComplaintPriority = "low" | "medium" | "high" | "critical";

export type ActionType =
  | "check_in"
  | "check_out"
  | "admin_adjustment";

export type NotificationTargetType = "all" | "block" | "service";

export type NoticePriority = "normal" | "important" | "urgent";

export type DocumentCategory =
  | "community_rules"
  | "service_guidelines"
  | "safety_instructions"
  | "notice";

// ── Firestore Document Interfaces ─────────────

export interface Community {
  id?: string;
  name: string;
  address: string;
  logoUrl?: string;
  emergencyContacts: EmergencyContact[];
  blocks: string[];
  contactDetails?: ContactDetails;
  configurationSettings?: Record<string, any>;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  role: string;
}

export interface ContactDetails {
  email?: string;
  phone?: string;
  website?: string;
}

export interface User {
  id?: string;
  communityId: string;
  name: string;
  phone: string;
  passwordHash?: string;
  role: UserRole;
  status: UserStatus;
  block?: string;
  floor?: string;
  houseNumber?: string;
  profilePhotoUrl?: string;
  emergencyContact?: EmergencyContact;
  // Admin-only
  assignedServiceIds?: string[];
  permissions?: AdminPermissions;
  // Metadata
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface AdminPermissions {
  canUpdateStatus: boolean;
  canEditTimings: boolean;
  canManageOccupancy: boolean;
  canResolveComplaints: boolean;
}

export interface Service {
  id?: string;
  communityId: string;
  name: string;
  type: ServiceType;
  description: string;
  maxCapacity: number;
  currentOccupancy: number;
  status: ServiceStatus;
  operatingDays: string[];
  operatingHours: OperatingHours;
  location: string;
  maintenanceSchedule?: MaintenanceSchedule;
  rules: string[];
  assignedAdminIds: string[];
  visibilitySettings: VisibilitySettings;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface OperatingHours {
  open: string;   // "06:00"
  close: string;  // "22:00"
}

export interface MaintenanceSchedule {
  day: string;
  time: string;
  note?: string;
}

export interface VisibilitySettings {
  isVisible: boolean;
  restrictedToBlocks?: string[];
}

export interface ServiceNotice {
  id?: string;
  communityId: string;
  serviceId: string;
  title: string;
  message: string;
  createdBy: string; // adminId
  priority: NoticePriority;
  isActive: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt?: FirebaseFirestore.Timestamp;
}

export interface ServiceLog {
  id?: string;
  communityId: string;
  serviceId: string;
  residentId: string;
  actionType: ActionType;
  timestamp: FirebaseFirestore.Timestamp;
  adjustedBy?: string; // adminId if admin_adjustment
  note?: string;
}

export interface OccupancySnapshot {
  id?: string;
  communityId: string;
  serviceId: string;
  occupancyCount: number;
  timestamp: FirebaseFirestore.Timestamp;
}

export interface Complaint {
  id?: string;
  communityId: string;
  residentId: string;
  linkedServiceId?: string;
  title: string;
  description: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  timeline: ComplaintTimelineEntry[];
  internalNotes?: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface ComplaintTimelineEntry {
  status: ComplaintStatus;
  changedBy: string;
  changedByRole: UserRole;
  note?: string;
  timestamp: FirebaseFirestore.Timestamp;
}

export interface Notification {
  id?: string;
  communityId: string;
  title: string;
  message: string;
  targetType: NotificationTargetType;
  targetReferenceId?: string; // blockId or serviceId
  createdBy: string; // superadminId
  readBy: string[];  // array of userIds
  createdAt: FirebaseFirestore.Timestamp;
}

export interface Document {
  id?: string;
  communityId: string;
  title: string;
  fileUrl: string;
  category: DocumentCategory;
  uploadedBy: string; // superadminId
  createdAt: FirebaseFirestore.Timestamp;
}

export interface AuditLog {
  id?: string;
  communityId: string;
  performedBy: string;   // userId
  role: UserRole;
  actionType: string;    // e.g. "RESIDENT_APPROVED", "SERVICE_STATUS_CHANGED"
  entityType: string;    // e.g. "users", "services", "complaints"
  entityId: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  timestamp: FirebaseFirestore.Timestamp;
}

// ── Request extensions ────────────────────────

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    communityId: string;
    role: UserRole;
    phone: string;
    assignedServiceIds?: string[];
    permissions?: AdminPermissions;
  };
}

// ── API response shapes ───────────────────────

export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
}

export interface ErrorResponse {
  success: false;
  errorCode: ErrorCode;
  message: string;
}

export type ErrorCode =
  | "AUTH_ERROR"
  | "PERMISSION_DENIED"
  | "VALIDATION_ERROR"
  | "RESOURCE_NOT_FOUND"
  | "COMMUNITY_SCOPE_ERROR"
  | "SERVICE_SCOPE_ERROR"
  | "CONFLICT_ERROR"
  | "SERVER_ERROR";

// ── Pagination ────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
  lastDocId?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total?: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
