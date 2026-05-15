import Joi from "joi";

// ── Auth ──────────────────────────────────────

export const loginSchema = Joi.object({
  phone: Joi.string().required(),
  password: Joi.string().optional(),
  otp: Joi.string().optional(),
}).or("password", "otp");

export const registerRequestSchema = Joi.object({
  phone: Joi.string().required(),
  name: Joi.string().min(2).max(100).required(),
  communityId: Joi.string().required(),
  block: Joi.string().required(),
  floor: Joi.string().optional(),
  houseNumber: Joi.string().required(),
});

// ── Community ─────────────────────────────────

export const communityUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  address: Joi.string().optional(),
  logoUrl: Joi.string().uri().optional(),
  emergencyContacts: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().required(),
        role: Joi.string().required(),
      })
    )
    .optional(),
  blocks: Joi.array().items(Joi.string()).optional(),
  contactDetails: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    website: Joi.string().uri().optional(),
  }).optional(),
});

// ── Residents ─────────────────────────────────

export const residentStatusSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "active", "suspended", "inactive", "blacklisted")
    .required(),
  reason: Joi.string().optional(),
});

export const manualAddResidentSchema = Joi.object({
  phone: Joi.string().required(),
  name: Joi.string().min(2).max(100).required(),
  block: Joi.string().required(),
  floor: Joi.string().optional(),
  houseNumber: Joi.string().required(),
  password: Joi.string().min(6).optional(),
});

// ── Admin ─────────────────────────────────────

export const createAdminSchema = Joi.object({
  phone: Joi.string().required(),
  name: Joi.string().min(2).max(100).required(),
  assignedServiceIds: Joi.array().items(Joi.string()).min(1).required(),
  permissions: Joi.object({
    canUpdateStatus: Joi.boolean().default(true),
    canEditTimings: Joi.boolean().default(false),
    canManageOccupancy: Joi.boolean().default(true),
    canResolveComplaints: Joi.boolean().default(true),
  }).optional(),
  password: Joi.string().min(6).required(),
});

export const updateAdminSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  assignedServiceIds: Joi.array().items(Joi.string()).optional(),
  permissions: Joi.object({
    canUpdateStatus: Joi.boolean().optional(),
    canEditTimings: Joi.boolean().optional(),
    canManageOccupancy: Joi.boolean().optional(),
    canResolveComplaints: Joi.boolean().optional(),
  }).optional(),
  status: Joi.string().valid("active", "inactive").optional(),
});

// ── Services ──────────────────────────────────

export const createServiceSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  type: Joi.string()
    .valid("gym", "pool", "party_hall", "parking", "clubhouse", "sports_area")
    .required(),
  description: Joi.string().optional(),
  maxCapacity: Joi.number().integer().min(1).required(),
  operatingDays: Joi.array().items(Joi.string()).min(1).required(),
  operatingHours: Joi.object({
    open: Joi.string().required(),
    close: Joi.string().required(),
  }).required(),
  location: Joi.string().required(),
  rules: Joi.array().items(Joi.string()).optional(),
  maintenanceSchedule: Joi.object({
    day: Joi.string().required(),
    time: Joi.string().required(),
    note: Joi.string().optional(),
  }).optional(),
  visibilitySettings: Joi.object({
    isVisible: Joi.boolean().default(true),
    restrictedToBlocks: Joi.array().items(Joi.string()).optional(),
  }).optional(),
});

export const updateServiceSchema = createServiceSchema.fork(
  ["name", "type", "maxCapacity", "operatingDays", "operatingHours", "location"],
  (schema) => schema.optional()
);

export const serviceStatusSchema = Joi.object({
  status: Joi.string()
    .valid("active", "maintenance", "temporarily_closed", "emergency_closed")
    .required(),
  reason: Joi.string().optional(),
});

// ── Service Notices ───────────────────────────

export const createNoticeSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  message: Joi.string().min(5).required(),
  priority: Joi.string().valid("normal", "important", "urgent").default("normal"),
  expiresAt: Joi.date().iso().greater("now").optional(),
});

// ── Complaints ────────────────────────────────

export const createComplaintSchema = Joi.object({
  title: Joi.string().min(3).max(150).required(),
  description: Joi.string().min(10).required(),
  category: Joi.string().required(),
  linkedServiceId: Joi.string().optional(),
  priority: Joi.string()
    .valid("low", "medium", "high", "critical")
    .default("medium"),
});

export const complainStatusSchema = Joi.object({
  status: Joi.string()
    .valid("open", "in_progress", "resolved", "rejected")
    .required(),
  note: Joi.string().optional(),
});

// ── Notifications ─────────────────────────────

export const createNotificationSchema = Joi.object({
  title: Joi.string().min(3).max(150).required(),
  message: Joi.string().min(5).required(),
  targetType: Joi.string().valid("all", "block", "service").required(),
  targetReferenceId: Joi.when("targetType", {
    is: Joi.valid("block", "service"),
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
});

// ── Occupancy ─────────────────────────────────

export const adjustOccupancySchema = Joi.object({
  currentOccupancy: Joi.number().integer().min(0).required(),
  note: Joi.string().optional(),
});

// ── Generic validator ─────────────────────────
export function validate<T>(schema: Joi.Schema, data: unknown): T {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    throw new Error(
      error.details.map((d) => d.message).join("; ")
    );
  }
  return value as T;
}
