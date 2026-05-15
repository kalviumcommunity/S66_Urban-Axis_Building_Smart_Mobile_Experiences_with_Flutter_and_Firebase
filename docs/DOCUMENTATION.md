# UrbanAxis – Complete Backend Documentation

> **Version:** 1.0.0  
> **Stack:** Node.js 20 · TypeScript · Express.js · Firebase Cloud Functions · Cloud Firestore · Firebase Authentication · Cloud Storage  
> **Architecture:** Serverless multi-tenant SaaS with role-based access control

---

## Table of Contents

1. [Project Overview](#1-project-overview)  
2. [Directory Structure](#2-directory-structure)  
3. [Role Hierarchy & Permissions](#3-role-hierarchy--permissions)  
4. [Application Flow](#4-application-flow)  
5. [File-by-File Reference](#5-file-by-file-reference)  
   - 5.1 [Root Configuration Files](#51-root-configuration-files)  
   - 5.2 [Functions Configuration](#52-functions-configuration)  
   - 5.3 [Entry Point – index.ts](#53-entry-point--indexts)  
   - 5.4 [Config](#54-config)  
   - 5.5 [Models & Types](#55-models--types)  
   - 5.6 [Middleware](#56-middleware)  
   - 5.7 [Utilities](#57-utilities)  
   - 5.8 [Routes](#58-routes)  
   - 5.9 [Controllers](#59-controllers)  
   - 5.10 [Schedulers](#510-schedulers)  
   - 5.11 [Scripts](#511-scripts)  
6. [Database Schema (Firestore Collections)](#6-database-schema-firestore-collections)  
7. [Security Model](#7-security-model)  
8. [Complete API Reference](#8-complete-api-reference)  
9. [Scheduled Jobs](#9-scheduled-jobs)  
10. [Getting Started – Step-by-Step](#10-getting-started--step-by-step)  
11. [Testing – Step-by-Step](#11-testing--step-by-step)  
12. [Changes Made (Bug Fixes)](#12-changes-made-bug-fixes)  

---

## 1. Project Overview

**UrbanAxis** is a community management platform for residential housing societies. It enables societies to manage shared amenities (Gym, Pool, Party Halls, Parking, etc.), handle resident complaints, broadcast notifications, and track real-time occupancy — all through a role-based REST API deployed as Firebase Cloud Functions.

### Key Features
- **Multi-tenant architecture** — each community is fully isolated via `communityId` scoping
- **Three-tier role system** — SuperAdmin → Admin → Resident, each with dedicated endpoints
- **Real-time occupancy tracking** — transactional check-in/check-out with Firestore transactions
- **Complaint lifecycle management** — create → in_progress → resolved/rejected, with timeline tracking
- **CSV bulk upload** — SuperAdmins can import residents via CSV file
- **Scheduled maintenance** — 5 Cloud Scheduler jobs for snapshots, archival, and cleanup
- **Full audit trail** — every significant action is logged to the `auditLogs` collection
- **Firestore security rules** — defense-in-depth with server-side AND database-level enforcement

---

## 2. Directory Structure

```
UrbanAxiss/
├── firebase.json                    # Firebase project configuration
├── .firebaserc                      # Firebase project alias (urbanaxis-app)
├── firestore.rules                  # Firestore security rules
├── firestore.indexes.json           # Composite index definitions
├── storage.rules                    # Cloud Storage security rules
├── README.md                        # Quick-start readme
├── DOCUMENTATION.md                 # This file
│
└── functions/
    ├── package.json                 # Dependencies & scripts
    ├── tsconfig.json                # TypeScript configuration
    ├── .eslintrc.js                 # Linting rules
    ├── .env.example                 # Environment variable template
    │
    ├── scripts/
    │   └── seed.ts                  # Initial data seeder
    │
    └── src/
        ├── index.ts                 # Express app + Cloud Function export
        │
        ├── config/
        │   └── firebase.ts          # Admin SDK init, db/auth/storage exports
        │
        ├── models/
        │   └── types.ts             # All interfaces, enums, type aliases
        │
        ├── middleware/
        │   ├── authenticate.ts      # JWT token verification + user loading
        │   └── roleCheck.ts         # Role, scope, and permission middleware
        │
        ├── utils/
        │   ├── response.ts          # Standardised JSON response helpers
        │   ├── auditLog.ts          # Audit log writer + action constants
        │   ├── occupancy.ts         # Transactional occupancy operations
        │   └── validation.ts        # Joi schemas + validate() helper
        │
        ├── routes/
        │   ├── authRoutes.ts        # Public auth endpoints
        │   ├── superadminRoutes.ts  # SuperAdmin endpoints (29 routes)
        │   ├── adminRoutes.ts       # Admin endpoints (12 routes)
        │   └── residentRoutes.ts    # Resident endpoints (17 routes)
        │
        ├── controllers/
        │   ├── authController.ts    # Login, register, verify token
        │   │
        │   ├── superadmin/
        │   │   ├── communityController.ts    # Community CRUD + dashboard
        │   │   ├── residentController.ts     # Resident management + bulk upload
        │   │   ├── adminController.ts        # Admin account CRUD
        │   │   ├── serviceController.ts      # Service lifecycle management
        │   │   ├── complaintController.ts    # Complaint oversight
        │   │   ├── notificationController.ts # Broadcast notifications
        │   │   ├── documentController.ts     # Document upload/management
        │   │   └── auditLogController.ts     # Audit log queries
        │   │
        │   ├── admin/
        │   │   ├── dashboardController.ts    # Admin dashboard data
        │   │   ├── serviceController.ts      # Service ops within scope
        │   │   └── complaintController.ts    # Complaint handling
        │   │
        │   └── resident/
        │       ├── dashboardController.ts    # Resident dashboard data
        │       ├── serviceController.ts      # View services + check-in/out
        │       ├── complaintController.ts    # Own complaint management
        │       ├── notificationController.ts # View + mark-read notifications
        │       └── profileController.ts      # Profile + photo + documents
        │
        └── schedulers/
            └── index.ts             # 5 scheduled Cloud Functions
```

---

## 3. Role Hierarchy & Permissions

```
┌─────────────────────────────────────────────────────────┐
│                      SuperAdmin                         │
│  • Full control over community, residents, admins       │
│  • Manages all services, complaints, notifications      │
│  • Uploads documents, views audit logs                  │
│  • Can do everything an Admin can do                    │
├─────────────────────────────────────────────────────────┤
│                        Admin                            │
│  • Scoped to assigned services only                     │
│  • Granular permissions per admin:                      │
│    - canUpdateStatus (service status changes)           │
│    - canEditTimings (operating hours/days)              │
│    - canManageOccupancy (manual occupancy adjustment)   │
│    - canResolveComplaints (complaint status updates)    │
│  • Creates service notices, views service logs          │
│  • Handles complaints linked to their services          │
├─────────────────────────────────────────────────────────┤
│                       Resident                          │
│  • Views visible services (block-restricted)            │
│  • Check-in / check-out at amenities                   │
│  • Creates and tracks own complaints                   │
│  • Views notifications, community documents            │
│  • Manages own profile and profile photo               │
└─────────────────────────────────────────────────────────┘
```

### Admin Permissions Object

Each Admin user has an optional `permissions` object with these boolean flags:

| Permission             | Controls                              |
|------------------------|---------------------------------------|
| `canUpdateStatus`      | Ability to change a service's status  |
| `canEditTimings`       | Ability to change operating hours/days|
| `canManageOccupancy`   | Ability to manually adjust occupancy  |
| `canResolveComplaints` | Ability to update complaint statuses  |

SuperAdmins bypass all permission checks automatically.

---

## 4. Application Flow

### 4.1 Request Lifecycle

```
Client Request
    │
    ▼
Firebase Cloud Function (HTTPS)
    │
    ▼
Express.js App
    │
    ├── Helmet (security headers)
    ├── CORS (cross-origin config)
    ├── Morgan (HTTP logging)
    ├── Body Parser (JSON + URL-encoded)
    ├── Rate Limiter (200 req/15min general, 20/15min auth)
    │
    ▼
Route Matching (/api/v1/{auth|superadmin|admin|resident}/...)
    │
    ▼
Middleware Chain:
    ├── authenticate()          → Verify Firebase ID token, load user profile
    ├── requireRole(...)        → Check user role against allowed roles
    ├── requireServiceScope()   → (Admin routes) Verify service assignment
    ├── requirePermission(...)  → (Admin routes) Check granular permission
    │
    ▼
Controller Function
    ├── Validate request body (Joi schemas)
    ├── Execute business logic (Firestore queries/transactions)
    ├── Write audit log (if applicable)
    │
    ▼
Standardised JSON Response
    ├── Success: { success: true, message: "...", data: {...} }
    └── Error:   { success: false, errorCode: "...", message: "..." }
```

### 4.2 Authentication Flow

```
1. Resident submits registration request
   POST /api/v1/auth/register-request
   → Creates user doc with status: "pending"
   → Logs RESIDENT_REQUEST_SUBMITTED audit

2. SuperAdmin approves/rejects resident
   PATCH /api/v1/superadmin/residents/:id/status
   → Changes status to "active" or "inactive"
   → Creates Firebase Auth account (on approval)
   → Sets custom claims { role, communityId }
   → Logs audit

3. User logs in
   POST /api/v1/auth/login
   → Validates phone + password (bcrypt compare)
   → Creates custom token with { role, communityId }
   → Client exchanges custom token for ID token (client-side SDK)

4. Authenticated requests
   Authorization: Bearer <firebase-id-token>
   → authenticate() middleware verifies token
   → Loads user profile from Firestore
   → Checks user status (rejects suspended/blacklisted/pending)
   → Populates req.user { uid, communityId, role, phone, ... }
```

### 4.3 Occupancy Check-In/Check-Out Flow

```
Resident taps "Check In"
    │
    ▼
POST /api/v1/resident/services/:id/check-in
    │
    ▼
residentCheckIn() in utils/occupancy.ts
    │
    ▼
Firestore Transaction:
    ├── Read service document (atomic)
    ├── Verify status == "active"
    ├── Verify currentOccupancy < maxCapacity
    ├── Increment currentOccupancy by 1
    ├── Write serviceLog entry (actionType: "check_in")
    └── Commit (or fail and retry)
    │
    ▼
writeAuditLog() → OCCUPANCY_CHECKIN
    │
    ▼
Response: { success: true, message: "Checked in successfully" }
```

Check-out follows the same pattern but decrements (floor of 0).

### 4.4 Complaint Lifecycle

```
Resident creates complaint
  POST /api/v1/resident/complaints
    │ status: "open", timeline: [{ status: "open", ... }]
    │
    ▼
Admin/SuperAdmin updates status
  PATCH /api/v1/superadmin/complaints/:id/status
  PATCH /api/v1/admin/complaints/:id/status
    │ New timeline entry appended
    │ status → "in_progress" | "resolved" | "rejected"
    │
    ▼
Resident can close own complaint
  PATCH /api/v1/resident/complaints/:id/close
    │ Sets status: "resolved"
    │ Appends timeline entry

Resident can add comments
  POST /api/v1/resident/complaints/:id/comment
    │ Appends to timeline (status stays same)

Admin can add internal notes
  PATCH /api/v1/admin/complaints/:id/note
    │ Appends to internalNotes array (not visible to resident)
```

### 4.5 Scheduled Jobs Flow

```
┌──────────────────────────────────────────────────────┐
│  Every 60 minutes (hourly)                           │
│  takeOccupancySnapshot                               │
│  → Reads all active services                         │
│  → Creates occupancySnapshot doc for each            │
│  → Records { serviceId, occupancyCount, timestamp }  │
├──────────────────────────────────────────────────────┤
│  Daily at 00:00 IST                                  │
│  expireServiceNotices                                │
│  → Queries notices where expiresAt <= now            │
│  → Sets isActive = false (batch)                     │
├──────────────────────────────────────────────────────┤
│  Sundays at 02:00 IST                                │
│  archiveOldServiceLogs                               │
│  → Moves logs older than 90 days                     │
│  → Copies to serviceLogsArchive collection           │
│  → Deletes originals (batches of 500)                │
├──────────────────────────────────────────────────────┤
│  Sundays at 03:00 IST                                │
│  archiveOldSnapshots                                 │
│  → Deletes occupancy snapshots older than 30 days    │
│  → Processes in batches of 500                       │
├──────────────────────────────────────────────────────┤
│  Daily at 23:59 IST                                  │
│  resetOccupancyAtMidnight                            │
│  → Resets currentOccupancy = 0 for all active svc    │
│  → Ensures clean slate each day                      │
└──────────────────────────────────────────────────────┘
```

---

## 5. File-by-File Reference

### 5.1 Root Configuration Files

#### `firebase.json`
**Purpose:** Firebase project configuration — tells the Firebase CLI how to deploy each service.

| Setting | Description |
|---------|-------------|
| `firestore.rules` → `firestore.rules` | Path to Firestore security rules |
| `firestore.indexes` → `firestore.indexes.json` | Path to composite index definitions |
| `functions[0].source` → `functions` | Functions source directory |
| `functions[0].predeploy` | Runs `npm lint` then `npm build` before deploy |
| `hosting.public` → `public` | Static hosting directory |
| `hosting.rewrites` | Rewrites `/api/v1/**` to the `api` Cloud Function |
| `storage.rules` → `storage.rules` | Path to Cloud Storage security rules |

#### `.firebaserc`
**Purpose:** Links the workspace to the Firebase project `urbanaxis-app`.

#### `firestore.rules`
**Purpose:** Server-side Firestore security rules. Enforces authentication, role checks, community scoping, and field-level restrictions for every collection.

**Helper functions defined:**

| Function | What it does |
|----------|--------------|
| `isAuthenticated()` | Checks `request.auth != null` |
| `getUserData()` | Reads the user doc at `/users/{uid}` |
| `getRole()` | Returns the user's `role` field |
| `getCommunityId()` | Returns the user's `communityId` field |
| `isSuperAdmin()` | Authenticated AND role == `superadmin` |
| `isAdmin()` | Authenticated AND role == `admin` |
| `isResident()` | Authenticated AND role == `resident` |
| `isStaff()` | Role is `superadmin` or `admin` |
| `sameCommunity(docCommunityId)` | User's communityId matches the document's |
| `isActiveUser()` | User status is `active` |
| `onlyUpdating(fields)` | Ensures only the listed fields are being changed |

**Collection access summary:**

| Collection | Read | Write (Create/Update/Delete) |
|------------|------|------------------------------|
| `communities` | Auth + same community + active | SuperAdmin update only |
| `users` | Self or staff in same community | Admin SDK only for create; self/SA/Admin for updates |
| `services` | Same community (staff or isVisible) | SuperAdmin create/update; Admin limited update |
| `serviceNotices` | Same community | Staff create/update; SuperAdmin delete |
| `serviceLogs` | Staff in same community | Auth + own residentId create only |
| `occupancySnapshots` | Staff in same community | Cloud Functions only |
| `complaints` | Same community (staff or own) | Resident create; staff/owner update |
| `notifications` | Same community | SuperAdmin create/update; others readBy only |
| `documents` | Same community | SuperAdmin create/delete |
| `auditLogs` | SuperAdmin in same community | Cloud Functions only |

#### `firestore.indexes.json`
**Purpose:** Defines 26 composite indexes and 3 field overrides for optimised Firestore queries.

**Indexes by collection:**

| Collection | # Indexes | Fields Covered |
|------------|-----------|----------------|
| `users` | 4 | communityId+role, +status, +block, +phone |
| `services` | 3 | communityId+status, +type, +isVisible |
| `serviceNotices` | 3 | communityId+serviceId+createdAt, serviceId+isActive+createdAt, isActive+expiresAt |
| `serviceLogs` | 3 | communityId+serviceId+timestamp, +residentId+timestamp, timestamp only |
| `occupancySnapshots` | 2 | communityId+serviceId+timestamp, timestamp only |
| `complaints` | 5 | communityId + (status, residentId, linkedServiceId, category) + createdAt, +residentId+status |
| `notifications` | 1 | communityId+createdAt |
| `documents` | 1 | communityId+category+createdAt |
| `auditLogs` | 4 | communityId + (timestamp, performedBy, entityType, actionType) |

**Field overrides (disabled single-field indexes):**

| Collection | Field | Reason |
|------------|-------|--------|
| `serviceLogs` | `note` | Avoid write overhead on high-frequency collection |
| `auditLogs` | `previousData` | Large JSON blob, not queried |
| `auditLogs` | `newData` | Large JSON blob, not queried |

#### `storage.rules`
**Purpose:** Cloud Storage access rules with file type and size restrictions.

| Path | Access | Constraints |
|------|--------|-------------|
| `communities/{cid}/logo/{file}` | Read: authenticated; Write: SuperAdmin of community | Image only, max 5 MB |
| `communities/{cid}/documents/{file}` | Read: active community member; Write: SuperAdmin | PDF only, max 20 MB |
| `communities/{cid}/profiles/{file}` | Read: active community member; Write: active community member | Image only, max 3 MB |
| `{allPaths=**}` (default) | Deny all | — |

#### `.env.example`
**Purpose:** Template for required environment variables.

| Variable | Example Value | Purpose |
|----------|---------------|---------|
| `FIREBASE_PROJECT_ID` | `urbanaxis-app` | Firebase project identifier |
| `FIREBASE_CLIENT_EMAIL` | `sa@...iam.gserviceaccount.com` | Service account email |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY...` | Service account private key |
| `FIREBASE_STORAGE_BUCKET` | `urbanaxis-app.appspot.com` | Cloud Storage bucket |
| `NODE_ENV` | `production` | Environment mode |
| `API_VERSION` | `v1` | API version prefix |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | `200` | Max requests per window |
| `AUTH_RATE_LIMIT_MAX` | `20` | Max auth requests per window |

---

### 5.2 Functions Configuration

#### `functions/package.json`
- **Name:** `urbanaxis-functions`
- **Engine:** Node.js 20
- **Entry:** `lib/index.js` (compiled output)

**Scripts:**

| Script | Command | Purpose |
|--------|---------|---------|
| `build` | `tsc` | Compile TypeScript to JavaScript |
| `build:watch` | `tsc --watch` | Watch mode compilation |
| `serve` | `npm run build && firebase emulators:start --only functions` | Local emulator |
| `shell` | `npm run build && firebase functions:shell` | Interactive shell |
| `start` | `npm run shell` | Alias for shell |
| `deploy` | `firebase deploy --only functions` | Deploy to Firebase |
| `logs` | `firebase functions:log` | View production logs |
| `lint` | `eslint --ext .ts src/` | Run ESLint |
| `lint:fix` | `eslint --fix --ext .ts src/` | Auto-fix lint issues |

**Runtime Dependencies:**

| Package | Purpose |
|---------|---------|
| `express` | HTTP framework inside Cloud Functions |
| `cors` | Cross-origin request handling |
| `firebase-admin` (^12) | Server-side Firebase SDK |
| `firebase-functions` (^4.6) | Cloud Functions framework |
| `multer` | Multipart file upload handling (memory storage) |
| `csv-parse` | CSV parsing for bulk resident upload |
| `joi` | Request body validation |
| `helmet` | Security headers |
| `express-rate-limit` | Rate limiting |
| `morgan` | HTTP request logging |
| `uuid` | Unique ID generation |
| `bcryptjs` | Password hashing and comparison |

#### `functions/tsconfig.json`
- **Target:** ES2020
- **Module:** CommonJS
- **Strict:** true (all strict checks enabled)
- **Output:** `lib/` directory
- **Path aliases:** `@config/*`, `@middleware/*`, `@controllers/*`, `@routes/*`, `@models/*`, `@utils/*`, `@schedulers/*`

---

### 5.3 Entry Point – `index.ts`

**File:** `functions/src/index.ts`

**Purpose:** Creates the Express app, configures all middleware, mounts route groups at `/api/v1/*`, and exports the `api` Cloud Function plus 5 scheduled functions.

**What it does step-by-step:**

1. Initialises Express app
2. Attaches **Helmet** — sets secure HTTP headers
3. Attaches **CORS** — allows cross-origin requests
4. Attaches **Morgan** — logs HTTP requests (dev format)
5. Attaches **Body parsers** — JSON (10 MB limit) + URL-encoded
6. Creates rate limiters:
   - **Global limiter:** 200 requests per 15-minute window
   - **Auth limiter:** 20 requests per 15-minute window
7. Mounts routes:
   - `/api/v1/auth` → `authRoutes` (with auth rate limiter)
   - `/api/v1/superadmin` → `superadminRoutes` (with global limiter)
   - `/api/v1/admin` → `adminRoutes` (with global limiter)
   - `/api/v1/resident` → `residentRoutes` (with global limiter)
8. Adds `GET /health` endpoint (returns 200 OK)
9. Adds catch-all 404 handler
10. Adds global error handler (500)
11. Exports `api` as an HTTPS Cloud Function (`512MB` memory, `60s` timeout)
12. Re-exports 5 scheduled functions from `schedulers/index.ts`

**Exports:**

| Name | Type |
|------|------|
| `api` | `functions.HttpsFunction` — the main API Cloud Function |
| `takeOccupancySnapshot` | Re-exported scheduled function |
| `expireServiceNotices` | Re-exported scheduled function |
| `archiveOldServiceLogs` | Re-exported scheduled function |
| `archiveOldSnapshots` | Re-exported scheduled function |
| `resetOccupancyAtMidnight` | Re-exported scheduled function |

---

### 5.4 Config

#### `functions/src/config/firebase.ts`

**Purpose:** Initialises the Firebase Admin SDK and exports shared references used throughout the app.

**Exports:**

| Export | Type | Description |
|--------|------|-------------|
| `db` | `admin.firestore.Firestore` | Firestore database instance |
| `auth` | `admin.auth.Auth` | Firebase Authentication instance |
| `storage` | `admin.storage.Storage` | Cloud Storage instance |
| `COLLECTIONS` | `const object` | Mapping of collection name constants |
| `logger` | `functions.logger` | Structured Cloud Functions logger |
| `FieldValue` | `admin.firestore.FieldValue` | Firestore increment/arrayUnion/etc. |
| `Timestamp` | `admin.firestore.Timestamp` | Firestore timestamp class |

**COLLECTIONS mapping:**

| Constant | Collection Name |
|----------|----------------|
| `COMMUNITIES` | `communities` |
| `USERS` | `users` |
| `SERVICES` | `services` |
| `SERVICE_NOTICES` | `serviceNotices` |
| `SERVICE_LOGS` | `serviceLogs` |
| `OCCUPANCY_SNAPSHOTS` | `occupancySnapshots` |
| `COMPLAINTS` | `complaints` |
| `NOTIFICATIONS` | `notifications` |
| `DOCUMENTS` | `documents` |
| `AUDIT_LOGS` | `auditLogs` |

---

### 5.5 Models & Types

#### `functions/src/models/types.ts`

**Purpose:** Central type definitions for the entire application — all interfaces, type aliases, and shared shapes.

**Type Aliases (string union types):**

| Type | Values |
|------|--------|
| `UserRole` | `"superadmin"`, `"admin"`, `"resident"` |
| `UserStatus` | `"pending"`, `"active"`, `"suspended"`, `"inactive"`, `"blacklisted"` |
| `ServiceType` | `"gym"`, `"pool"`, `"party_hall"`, `"parking"`, `"clubhouse"`, `"sports_area"` |
| `ServiceStatus` | `"active"`, `"maintenance"`, `"temporarily_closed"`, `"emergency_closed"` |
| `ComplaintStatus` | `"open"`, `"in_progress"`, `"resolved"`, `"rejected"` |
| `ComplaintPriority` | `"low"`, `"medium"`, `"high"`, `"critical"` |
| `ActionType` | `"check_in"`, `"check_out"`, `"admin_adjustment"` |
| `NotificationTargetType` | `"all"`, `"block"`, `"service"` |
| `NoticePriority` | `"normal"`, `"important"`, `"urgent"` |
| `DocumentCategory` | `"community_rules"`, `"service_guidelines"`, `"safety_instructions"`, `"notice"` |
| `ErrorCode` | `"AUTH_ERROR"`, `"PERMISSION_DENIED"`, `"VALIDATION_ERROR"`, `"RESOURCE_NOT_FOUND"`, `"COMMUNITY_SCOPE_ERROR"`, `"SERVICE_SCOPE_ERROR"`, `"CONFLICT_ERROR"`, `"SERVER_ERROR"` |

**Interfaces:**

| Interface | Key Fields |
|-----------|------------|
| `Community` | `id, name, address, logoUrl, emergencyContacts[], blocks[], contactDetails, configurationSettings, createdAt, updatedAt` |
| `EmergencyContact` | `name, phone, role` |
| `ContactDetails` | `email, phone, website` |
| `User` | `id, communityId, name, phone, passwordHash, role, status, block, floor, houseNumber, profilePhotoUrl, emergencyContact, assignedServiceIds, permissions, createdAt, updatedAt` |
| `AdminPermissions` | `canUpdateStatus, canEditTimings, canManageOccupancy, canResolveComplaints` |
| `Service` | `id, communityId, name, type, description, maxCapacity, currentOccupancy, status, operatingDays[], operatingHours, location, maintenanceSchedule, rules[], assignedAdminIds[], visibilitySettings, createdAt, updatedAt` |
| `OperatingHours` | `open, close` (time strings) |
| `MaintenanceSchedule` | `day, time, note` |
| `VisibilitySettings` | `isVisible, restrictedToBlocks[]` |
| `ServiceNotice` | `id, communityId, serviceId, title, message, createdBy, priority, isActive, createdAt, expiresAt` |
| `ServiceLog` | `id, communityId, serviceId, residentId, actionType, timestamp, adjustedBy, note` |
| `OccupancySnapshot` | `id, communityId, serviceId, occupancyCount, timestamp` |
| `Complaint` | `id, communityId, residentId, linkedServiceId, title, description, category, priority, status, timeline[], internalNotes, createdAt, updatedAt` |
| `ComplaintTimelineEntry` | `status, changedBy, changedByRole, note, timestamp` |
| `Notification` | `id, communityId, title, message, targetType, targetReferenceId, createdBy, readBy[], createdAt` |
| `Document` | `id, communityId, title, fileUrl, category, uploadedBy, createdAt` |
| `AuditLog` | `id, communityId, performedBy, role, actionType, entityType, entityId, previousData, newData, timestamp` |
| `AuthenticatedRequest` | Extends Express `Request` with `user?: { uid, communityId, role, phone, assignedServiceIds, permissions }` |
| `SuccessResponse<T>` | `success: true, message: string, data: T` |
| `ErrorResponse` | `success: false, errorCode: ErrorCode, message: string` |
| `PaginationParams` | `page, limit, lastDocId` |
| `PaginatedResult<T>` | `items: T[], total, page, limit, hasMore` |

---

### 5.6 Middleware

#### `functions/src/middleware/authenticate.ts`

**Purpose:** Verifies the Firebase ID token from the `Authorization: Bearer <token>` header, loads the user's profile from Firestore, checks account status, and populates `req.user`.

**Export:**

| Function | Signature |
|----------|-----------|
| `authenticate` | `(req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>` |

**Flow:**
1. Extracts token from `Authorization: Bearer <token>` header
2. Verifies token via `auth.verifyIdToken(token)`
3. Reads user doc from `users/{uid}` in Firestore
4. Checks user status — rejects `suspended`, `blacklisted`, `pending`
5. Populates `req.user` with `{ uid, communityId, role, phone, assignedServiceIds, permissions }`
6. Calls `next()` on success, returns 401/403 on failure

#### `functions/src/middleware/roleCheck.ts`

**Purpose:** Middleware factories for role-based access, community scope, service scope, and granular permission checks.

**Exports:**

| Function | Signature | Description |
|----------|-----------|-------------|
| `requireRole(...roles)` | `(...roles: UserRole[]) => middleware` | Asserts user has one of the listed roles |
| `requireCommunityScope` | `(req, res, next) => void` | Asserts communityId in URL/body/query matches `req.user.communityId` |
| `requireServiceScope` | `(req, res, next) => void` | Asserts admin is assigned to the target service (SuperAdmin bypasses) |
| `requirePermission(key)` | `(permissionKey: keyof AdminPermissions) => middleware` | Asserts admin has a specific permission flag (SuperAdmin bypasses) |

---

### 5.7 Utilities

#### `functions/src/utils/response.ts`

**Purpose:** Standardised JSON response helpers. All API responses use `SuccessResponse<T>` or `ErrorResponse` shapes.

| Function | Status Code | Purpose |
|----------|-------------|---------|
| `sendSuccess<T>(res, data, message?, statusCode?)` | 200 (default) | Standard success response |
| `sendError(res, errorCode, message, statusCode?)` | 400 (default) | Standard error response |
| `sendNotFound(res, entity?)` | 404 | Resource not found |
| `sendUnauthorized(res, msg?)` | 401 | Authentication failure |
| `sendForbidden(res, msg?)` | 403 | Permission denied |
| `sendValidationError(res, msg)` | 422 | Validation failure |
| `sendServerError(res, err?)` | 500 | Internal server error |

#### `functions/src/utils/auditLog.ts`

**Purpose:** Writes immutable audit-log entries to Firestore and provides predefined action-type constants.

**Exports:**

| Export | Description |
|--------|-------------|
| `writeAuditLog(params)` | Creates an audit log document in `auditLogs` collection |
| `AUDIT_ACTIONS` | Object with 22 predefined action type strings |

**AUDIT_ACTIONS keys:** `COMMUNITY_UPDATED`, `RESIDENT_REQUEST_SUBMITTED`, `RESIDENT_APPROVED`, `RESIDENT_REJECTED`, `RESIDENT_STATUS_CHANGED`, `RESIDENT_UPDATED`, `ADMIN_CREATED`, `ADMIN_UPDATED`, `ADMIN_DEACTIVATED`, `ADMIN_SERVICE_ASSIGNED`, `SERVICE_CREATED`, `SERVICE_UPDATED`, `SERVICE_STATUS_CHANGED`, `SERVICE_ADMIN_ASSIGNED`, `OCCUPANCY_CHECKIN`, `OCCUPANCY_CHECKOUT`, `OCCUPANCY_ADMIN_ADJUSTED`, `COMPLAINT_CREATED`, `COMPLAINT_STATUS_CHANGED`, `NOTICE_CREATED`, `NOTIFICATION_SENT`, `DOCUMENT_UPLOADED`

#### `functions/src/utils/occupancy.ts`

**Purpose:** Transactional occupancy operations and batch snapshot creation.

| Function | Description |
|----------|-------------|
| `residentCheckIn(communityId, serviceId, residentId)` | Atomically increments occupancy, writes service log (Firestore transaction) |
| `residentCheckOut(communityId, serviceId, residentId)` | Atomically decrements occupancy (floor 0), writes service log (Firestore transaction) |
| `adminAdjustOccupancy(communityId, serviceId, adminId, newOccupancy, note?)` | Sets occupancy to an exact value, writes service log |
| `createOccupancySnapshots()` | Iterates all active services, writes snapshot docs for current occupancy |

#### `functions/src/utils/validation.ts`

**Purpose:** Joi validation schemas for every writable endpoint and a generic validator.

**Schemas:**

| Schema | Validates | Used By |
|--------|-----------|---------|
| `loginSchema` | `{ phone, password?, otp? }` | `POST /auth/login` |
| `registerRequestSchema` | `{ phone, name, communityId, block, floor?, houseNumber }` | `POST /auth/register-request` |
| `communityUpdateSchema` | `{ name?, address?, logoUrl?, emergencyContacts?, ... }` | `PATCH /superadmin/community` |
| `residentStatusSchema` | `{ status, reason? }` | `PATCH /superadmin/residents/:id/status` |
| `manualAddResidentSchema` | `{ phone, name, block, floor?, houseNumber, password? }` | `POST /superadmin/residents` |
| `createAdminSchema` | `{ phone, name, assignedServiceIds, permissions?, password }` | `POST /superadmin/admins` |
| `updateAdminSchema` | `{ name?, assignedServiceIds?, permissions?, status? }` | `PATCH /superadmin/admins/:id` |
| `createServiceSchema` | `{ name, type, description?, maxCapacity, ... }` | `POST /superadmin/services` |
| `updateServiceSchema` | All fields optional fork of createService | `PATCH /superadmin/services/:id` |
| `serviceStatusSchema` | `{ status, reason? }` | `PATCH /.../services/:id/status` |
| `createNoticeSchema` | `{ title, message, priority?, expiresAt? }` | `POST /admin/services/:id/notices` |
| `createComplaintSchema` | `{ title, description, category, linkedServiceId?, priority? }` | `POST /resident/complaints` |
| `complainStatusSchema` | `{ status, note? }` | `PATCH /.../complaints/:id/status` |
| `createNotificationSchema` | `{ title, message, targetType, targetReferenceId? }` | `POST /superadmin/notifications` |
| `adjustOccupancySchema` | `{ currentOccupancy, note? }` | `PATCH /admin/services/:id/occupancy` |

**Generic validator:**

```typescript
validate<T>(schema: Joi.Schema, data: unknown) => T  // throws JoiValidationError on failure
```

---

### 5.8 Routes

#### `functions/src/routes/authRoutes.ts`
Public endpoints (no auth middleware). Protected by `authLimiter` (20 req/15min).

| Method | Path | Handler |
|--------|------|---------|
| POST | `/api/v1/auth/login` | `login` |
| POST | `/api/v1/auth/register-request` | `registerRequest` |
| POST | `/api/v1/auth/verify-token` | `verifyToken` |

#### `functions/src/routes/superadminRoutes.ts`
All routes use: `authenticate` → `requireRole("superadmin")`

| Method | Path | Handler |
|--------|------|---------|
| GET | `/api/v1/superadmin/community` | `getCommunity` |
| PATCH | `/api/v1/superadmin/community` | `updateCommunity` |
| GET | `/api/v1/superadmin/dashboard` | `getDashboard` |
| GET | `/api/v1/superadmin/residents` | `getResidents` |
| POST | `/api/v1/superadmin/residents` | `addResident` |
| POST | `/api/v1/superadmin/residents/bulk-upload` | `bulkUploadResidents` |
| GET | `/api/v1/superadmin/residents/:id` | `getResident` |
| PATCH | `/api/v1/superadmin/residents/:id` | `updateResident` |
| PATCH | `/api/v1/superadmin/residents/:id/status` | `updateResidentStatus` |
| GET | `/api/v1/superadmin/admins` | `getAdmins` |
| POST | `/api/v1/superadmin/admins` | `createAdmin` |
| PATCH | `/api/v1/superadmin/admins/:id` | `updateAdmin` |
| GET | `/api/v1/superadmin/admins/:id/activity` | `getAdminActivity` |
| GET | `/api/v1/superadmin/services` | `getServices` |
| POST | `/api/v1/superadmin/services` | `createService` |
| GET | `/api/v1/superadmin/services/:id` | `getService` |
| PATCH | `/api/v1/superadmin/services/:id` | `updateService` |
| PATCH | `/api/v1/superadmin/services/:id/status` | `updateServiceStatus` |
| PATCH | `/api/v1/superadmin/services/:id/assign-admins` | `assignAdminsToService` |
| PATCH | `/api/v1/superadmin/services/:id/visibility` | `updateServiceVisibility` |
| GET | `/api/v1/superadmin/complaints` | `getComplaints` |
| GET | `/api/v1/superadmin/complaints/:id` | `getComplaint` |
| PATCH | `/api/v1/superadmin/complaints/:id/status` | `updateComplaintStatus` |
| GET | `/api/v1/superadmin/notifications` | `getNotifications` |
| POST | `/api/v1/superadmin/notifications` | `sendNotification` |
| GET | `/api/v1/superadmin/documents` | `getDocuments` |
| POST | `/api/v1/superadmin/documents` | `uploadDocument` |
| DELETE | `/api/v1/superadmin/documents/:id` | `deleteDocument` |
| GET | `/api/v1/superadmin/audit-logs` | `getAuditLogs` |

#### `functions/src/routes/adminRoutes.ts`
All routes use: `authenticate` → `requireRole("admin")`

| Method | Path | Extra Middleware | Handler |
|--------|------|------------------|---------|
| GET | `/api/v1/admin/dashboard` | — | `getAdminDashboard` |
| GET | `/api/v1/admin/services/:id` | `requireServiceScope` | `getAdminService` |
| PATCH | `/api/v1/admin/services/:id/status` | `requireServiceScope`, `requirePermission("canUpdateStatus")` | `updateAdminServiceStatus` |
| PATCH | `/api/v1/admin/services/:id/occupancy` | `requireServiceScope`, `requirePermission("canManageOccupancy")` | `adjustServiceOccupancy` |
| PATCH | `/api/v1/admin/services/:id/timings` | `requireServiceScope`, `requirePermission("canEditTimings")` | `updateServiceTimings` |
| GET | `/api/v1/admin/services/:id/logs` | `requireServiceScope` | `getServiceLogs` |
| POST | `/api/v1/admin/services/:id/notices` | `requireServiceScope` | `createServiceNotice` |
| GET | `/api/v1/admin/services/:id/notices` | `requireServiceScope` | `getServiceNotices` |
| PATCH | `/api/v1/admin/notices/:noticeId` | — | `updateNotice` |
| GET | `/api/v1/admin/complaints` | — | `getAdminComplaints` |
| PATCH | `/api/v1/admin/complaints/:id/status` | `requirePermission("canResolveComplaints")` | `updateAdminComplaintStatus` |
| PATCH | `/api/v1/admin/complaints/:id/note` | — | `addInternalNote` |

#### `functions/src/routes/residentRoutes.ts`
All routes use: `authenticate` → `requireRole("resident")`

| Method | Path | Handler |
|--------|------|---------|
| GET | `/api/v1/resident/dashboard` | `getResidentDashboard` |
| GET | `/api/v1/resident/services` | `getResidentServices` |
| GET | `/api/v1/resident/services/:id` | `getResidentService` |
| POST | `/api/v1/resident/services/:id/check-in` | `checkIn` |
| POST | `/api/v1/resident/services/:id/check-out` | `checkOut` |
| GET | `/api/v1/resident/complaints` | `getMyComplaints` |
| POST | `/api/v1/resident/complaints` | `createComplaint` |
| GET | `/api/v1/resident/complaints/:id` | `getMyComplaint` |
| PATCH | `/api/v1/resident/complaints/:id/close` | `closeMyComplaint` |
| POST | `/api/v1/resident/complaints/:id/comment` | `addComplaintComment` |
| GET | `/api/v1/resident/notifications` | `getResidentNotifications` |
| PATCH | `/api/v1/resident/notifications/:id/read` | `markNotificationRead` |
| GET | `/api/v1/resident/profile` | `getProfile` |
| PATCH | `/api/v1/resident/profile` | `updateProfile` |
| POST | `/api/v1/resident/profile/photo` | `uploadProfilePhoto` |
| POST | `/api/v1/resident/profile/request-house-change` | `requestHouseChange` |
| GET | `/api/v1/resident/documents` | `getResidentDocuments` |

---

### 5.9 Controllers

#### Auth Controller — `functions/src/controllers/authController.ts`

| Function | HTTP | Description |
|----------|------|-------------|
| `login` | `POST /api/v1/auth/login` | Validates phone + password via bcrypt, creates Firebase custom token with role/communityId claims |
| `registerRequest` | `POST /api/v1/auth/register-request` | Creates a user doc with `status: "pending"` for SuperAdmin approval. Logs audit entry |
| `verifyToken` | `POST /api/v1/auth/verify-token` | Verifies a Firebase ID token and returns the decoded user info |

#### SuperAdmin Controllers

**`communityController.ts`** — Community profile + dashboard

| Function | HTTP | Description |
|----------|------|-------------|
| `getCommunity` | `GET /superadmin/community` | Returns full community document for the SuperAdmin's community |
| `updateCommunity` | `PATCH /superadmin/community` | Updates community fields (validated by `communityUpdateSchema`), logs audit |
| `getDashboard` | `GET /superadmin/dashboard` | Aggregates: resident count, admin count, service count, active complaint count, recent notifications |

**`residentController.ts`** — Resident management

| Function | HTTP | Description |
|----------|------|-------------|
| `getResidents` | `GET /superadmin/residents` | Lists residents with filters: `status`, `block`, `search` (name/phone). Paginated |
| `getResident` | `GET /superadmin/residents/:id` | Returns a single resident's full profile |
| `addResident` | `POST /superadmin/residents` | Manually creates a resident: validates, creates Firebase Auth account, hashes password, creates user doc, logs audit |
| `updateResidentStatus` | `PATCH /superadmin/residents/:id/status` | Changes resident status (active/suspended/blacklisted/inactive). On first activation: creates Firebase Auth account + custom claims |
| `updateResident` | `PATCH /superadmin/residents/:id` | Updates resident profile fields |
| `bulkUploadResidents` | `POST /superadmin/residents/bulk-upload` | Accepts CSV file (via multer), parses with csv-parse, creates residents in batch. Returns success/failure count |

**`adminController.ts`** — Admin account CRUD

| Function | HTTP | Description |
|----------|------|-------------|
| `createAdmin` | `POST /superadmin/admins` | Creates admin account: Firebase Auth + user doc + custom claims + syncs assignedServiceIds to service docs |
| `getAdmins` | `GET /superadmin/admins` | Lists all admins in the community |
| `updateAdmin` | `PATCH /superadmin/admins/:id` | Updates admin fields; syncs service assignments if changed |
| `getAdminActivity` | `GET /superadmin/admins/:id/activity` | Returns audit logs filtered by `performedBy` = admin ID |

**`serviceController.ts`** — Service lifecycle

| Function | HTTP | Description |
|----------|------|-------------|
| `createService` | `POST /superadmin/services` | Creates a new service with all configuration. Logs audit |
| `getServices` | `GET /superadmin/services` | Lists services with optional `type` and `status` filters |
| `getService` | `GET /superadmin/services/:id` | Returns full service document |
| `updateService` | `PATCH /superadmin/services/:id` | Updates service configuration. Logs audit with previous data |
| `updateServiceStatus` | `PATCH /superadmin/services/:id/status` | Changes service operational status. Logs audit |
| `assignAdminsToService` | `PATCH /superadmin/services/:id/assign-admins` | Updates `assignedAdminIds` on service AND syncs each admin's `assignedServiceIds`. Logs audit |
| `updateServiceVisibility` | `PATCH /superadmin/services/:id/visibility` | Updates `visibilitySettings` (isVisible, restrictedToBlocks). Logs audit |

**`complaintController.ts`** — Community-wide complaint oversight

| Function | HTTP | Description |
|----------|------|-------------|
| `getComplaints` | `GET /superadmin/complaints` | Lists complaints with filters: `status`, `category`, `residentId`, `linkedServiceId`. Paginated |
| `getComplaint` | `GET /superadmin/complaints/:id` | Returns full complaint with timeline |
| `updateComplaintStatus` | `PATCH /superadmin/complaints/:id/status` | Updates complaint status, appends timeline entry. Logs audit |

**`notificationController.ts`** — Broadcast notifications

| Function | HTTP | Description |
|----------|------|-------------|
| `sendNotification` | `POST /superadmin/notifications` | Creates targeted notification (all/block/service). Logs audit |
| `getNotifications` | `GET /superadmin/notifications` | Lists all community notifications (newest first) |

**`documentController.ts`** — Community documents

| Function | HTTP | Description |
|----------|------|-------------|
| `uploadDocument` | `POST /superadmin/documents` | Uploads file to Cloud Storage (`communities/{cid}/documents/`), creates Firestore doc. Logs audit |
| `getDocuments` | `GET /superadmin/documents` | Lists documents with optional `category` filter |
| `deleteDocument` | `DELETE /superadmin/documents/:id` | Deletes document from Storage + Firestore |

**`auditLogController.ts`** — Audit log queries

| Function | HTTP | Description |
|----------|------|-------------|
| `getAuditLogs` | `GET /superadmin/audit-logs` | Queries audit logs with optional filters: `entityType`, `performedBy`, `actionType`. Max 200 per page |

#### Admin Controllers

**`dashboardController.ts`** — Admin dashboard

| Function | HTTP | Description |
|----------|------|-------------|
| `getAdminDashboard` | `GET /admin/dashboard` | Returns assigned services (with occupancy data) + pending complaints count scoped to assigned services |

**`serviceController.ts`** — Service operations within admin's scope

| Function | HTTP | Description |
|----------|------|-------------|
| `getAdminService` | `GET /admin/services/:id` | Returns full service document (scoped by `requireServiceScope`) |
| `updateAdminServiceStatus` | `PATCH /admin/services/:id/status` | Changes service status (requires `canUpdateStatus` permission). Logs audit |
| `adjustServiceOccupancy` | `PATCH /admin/services/:id/occupancy` | Manually sets occupancy value (requires `canManageOccupancy`). Uses `adminAdjustOccupancy()` |
| `updateServiceTimings` | `PATCH /admin/services/:id/timings` | Updates operating hours/days (requires `canEditTimings`). Logs audit |
| `getServiceLogs` | `GET /admin/services/:id/logs` | Returns paginated service logs (check-in/check-out/adjustments) |
| `createServiceNotice` | `POST /admin/services/:id/notices` | Creates a notice for the service. Logs audit |
| `getServiceNotices` | `GET /admin/services/:id/notices` | Lists active/all notices for the service |
| `updateNotice` | `PATCH /admin/notices/:noticeId` | Updates notice content or deactivates it |

**`complaintController.ts`** — Complaint handling within admin's scope

| Function | HTTP | Description |
|----------|------|-------------|
| `getAdminComplaints` | `GET /admin/complaints` | Lists complaints linked to admin's assigned services + unlinked complaints |
| `updateAdminComplaintStatus` | `PATCH /admin/complaints/:id/status` | Updates status (requires `canResolveComplaints`). Appends timeline entry. Logs audit |
| `addInternalNote` | `PATCH /admin/complaints/:id/note` | Appends to `internalNotes` array (admin-only, not visible to residents) |

#### Resident Controllers

**`dashboardController.ts`** — Resident dashboard

| Function | HTTP | Description |
|----------|------|-------------|
| `getResidentDashboard` | `GET /resident/dashboard` | Returns: community name, visible services with availability, open complaint count, recent 10 notifications |

**`serviceController.ts`** — View services + check-in/out

| Function | HTTP | Description |
|----------|------|-------------|
| `getResidentServices` | `GET /resident/services` | Lists visible services (respects block restrictions via `visibilitySettings`) |
| `getResidentService` | `GET /resident/services/:id` | Returns service detail with active notices |
| `checkIn` | `POST /resident/services/:id/check-in` | Calls `residentCheckIn()` (transactional). Logs audit |
| `checkOut` | `POST /resident/services/:id/check-out` | Calls `residentCheckOut()` (transactional). Logs audit |

**`complaintController.ts`** — Own complaint management

| Function | HTTP | Description |
|----------|------|-------------|
| `createComplaint` | `POST /resident/complaints` | Creates complaint with initial timeline entry. Logs audit |
| `getMyComplaints` | `GET /resident/complaints` | Lists own complaints (filtered by residentId). Optional `status` filter |
| `getMyComplaint` | `GET /resident/complaints/:id` | Returns full complaint detail (verifies ownership) |
| `closeMyComplaint` | `PATCH /resident/complaints/:id/close` | Sets status to `resolved`, appends timeline entry |
| `addComplaintComment` | `POST /resident/complaints/:id/comment` | Appends comment to timeline (status unchanged) |

**`notificationController.ts`** — View + manage notifications

| Function | HTTP | Description |
|----------|------|-------------|
| `getResidentNotifications` | `GET /resident/notifications` | Lists notifications targeted to `all` or the resident's specific block |
| `markNotificationRead` | `PATCH /resident/notifications/:id/read` | Adds the resident's UID to the `readBy` array |

**`profileController.ts`** — Profile management

| Function | HTTP | Description |
|----------|------|-------------|
| `getProfile` | `GET /resident/profile` | Returns the resident's full user document |
| `updateProfile` | `PATCH /resident/profile` | Updates allowed fields (emergencyContact, name) |
| `uploadProfilePhoto` | `POST /resident/profile/photo` | Uploads image to Storage (`communities/{cid}/profiles/`), updates `profilePhotoUrl` |
| `requestHouseChange` | `POST /resident/profile/request-house-change` | Submits a house/block change request (creates audit log for SuperAdmin review) |
| `getResidentDocuments` | `GET /resident/documents` | Lists community documents visible to the resident |

---

### 5.10 Schedulers

#### `functions/src/schedulers/index.ts`

**Purpose:** 5 Cloud Scheduler–triggered Pub/Sub functions for automated maintenance.

| Function | Schedule | Timezone | Description |
|----------|----------|----------|-------------|
| `takeOccupancySnapshot` | `every 60 minutes` | Asia/Kolkata | Calls `createOccupancySnapshots()` — records current occupancy for all active services |
| `expireServiceNotices` | `0 0 * * *` (daily midnight) | Asia/Kolkata | Deactivates notices where `expiresAt <= now` |
| `archiveOldServiceLogs` | `0 2 * * 0` (Sundays 2 AM) | Asia/Kolkata | Moves service logs older than 90 days to `serviceLogsArchive`, deletes originals |
| `archiveOldSnapshots` | `0 3 * * 0` (Sundays 3 AM) | Asia/Kolkata | Deletes occupancy snapshots older than 30 days |
| `resetOccupancyAtMidnight` | `59 23 * * *` (daily 11:59 PM) | Asia/Kolkata | Resets `currentOccupancy` to 0 for all active services |

All schedulers use batch processing (500 docs per batch) for large collections.

---

### 5.11 Scripts

#### `functions/scripts/seed.ts`

**Purpose:** One-time seed script that bootstraps initial data for development/testing.

**What it creates:**

| Entity | Details |
|--------|---------|
| **Community** | "Sunrise Residency" — address: Bangalore, blocks: A/B/C/D, emergency contacts |
| **SuperAdmin** | Phone: `+919123456789`, password: `Admin@1234`, Firebase Auth account + Firestore doc + custom claims |
| **Service: Gym** | "Block A Gym", type: gym, capacity: 30, location: "Block A Ground Floor" |
| **Service: Pool** | "Swimming Pool", type: pool, capacity: 50, location: "Community Center" |
| **Service: Hall** | "Party Hall", type: party_hall, capacity: 150, location: "Block C Top Floor" |

**Run with:** `cd functions && npx ts-node scripts/seed.ts`

---

## 6. Database Schema (Firestore Collections)

### 6.1 `communities`
Stores community/society profiles. One document per community.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Community display name |
| `address` | string | Yes | Physical address |
| `logoUrl` | string | No | URL to community logo in Storage |
| `emergencyContacts` | array | Yes | List of `{ name, phone, role }` |
| `blocks` | array | Yes | List of block identifiers (e.g., `["A", "B", "C"]`) |
| `contactDetails` | map | No | `{ email?, phone?, website? }` |
| `configurationSettings` | map | No | Extensible settings object |
| `createdAt` | timestamp | Yes | Auto-set on creation |
| `updatedAt` | timestamp | Yes | Updated on every write |

### 6.2 `users`
Stores all user accounts (SuperAdmin, Admin, Resident).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `communityId` | string | Yes | Links user to a community |
| `name` | string | Yes | Display name |
| `phone` | string | Yes | Phone number (unique per community) |
| `passwordHash` | string | No | bcrypt-hashed password |
| `role` | string | Yes | `superadmin`, `admin`, or `resident` |
| `status` | string | Yes | `pending`, `active`, `suspended`, `inactive`, `blacklisted` |
| `block` | string | No | Block identifier (residents) |
| `floor` | string | No | Floor number |
| `houseNumber` | string | No | House/flat number |
| `profilePhotoUrl` | string | No | URL to profile photo in Storage |
| `emergencyContact` | map | No | `{ name, phone, relation }` |
| `assignedServiceIds` | array | No | Services assigned (admins only) |
| `permissions` | map | No | `AdminPermissions` object (admins only) |
| `createdAt` | timestamp | Yes | Auto-set |
| `updatedAt` | timestamp | Yes | Auto-updated |

### 6.3 `services`
Stores amenity/service configurations.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `communityId` | string | Yes | Parent community |
| `name` | string | Yes | Service display name |
| `type` | string | Yes | `gym`, `pool`, `party_hall`, `parking`, `clubhouse`, `sports_area` |
| `description` | string | Yes | Description text |
| `maxCapacity` | number | Yes | Maximum allowed occupancy |
| `currentOccupancy` | number | Yes | Live occupancy count |
| `status` | string | Yes | `active`, `maintenance`, `temporarily_closed`, `emergency_closed` |
| `operatingDays` | array | Yes | Days of operation (e.g., `["mon", "tue", ...]`) |
| `operatingHours` | map | Yes | `{ open: "06:00", close: "22:00" }` |
| `location` | string | Yes | Physical location description |
| `maintenanceSchedule` | map | No | `{ day, time, note }` |
| `rules` | array | No | List of rule strings |
| `assignedAdminIds` | array | Yes | UIDs of admins assigned to this service |
| `visibilitySettings` | map | Yes | `{ isVisible: bool, restrictedToBlocks?: string[] }` |
| `createdAt` | timestamp | Yes | Auto-set |
| `updatedAt` | timestamp | Yes | Auto-updated |

### 6.4 `serviceNotices`
Announcements/notices attached to services.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `communityId` | string | Yes | Parent community |
| `serviceId` | string | Yes | Parent service |
| `title` | string | Yes | Notice title |
| `message` | string | Yes | Notice body |
| `createdBy` | string | Yes | UID of creator |
| `priority` | string | Yes | `normal`, `important`, `urgent` |
| `isActive` | boolean | Yes | Whether notice is currently active |
| `createdAt` | timestamp | Yes | Auto-set |
| `expiresAt` | timestamp | No | Auto-deactivation date |

### 6.5 `serviceLogs`
Records every check-in, check-out, and admin adjustment.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `communityId` | string | Yes | Parent community |
| `serviceId` | string | Yes | Service involved |
| `residentId` | string | Yes | Resident who checked in/out |
| `actionType` | string | Yes | `check_in`, `check_out`, `admin_adjustment` |
| `timestamp` | timestamp | Yes | When the action occurred |
| `adjustedBy` | string | No | Admin UID (for adjustments) |
| `note` | string | No | Optional note |

### 6.6 `occupancySnapshots`
Periodic snapshots of service occupancy (created hourly by scheduler).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `communityId` | string | Yes | Parent community |
| `serviceId` | string | Yes | Service being snapshotted |
| `occupancyCount` | number | Yes | Occupancy at snapshot time |
| `timestamp` | timestamp | Yes | Snapshot time |

### 6.7 `complaints`
Resident complaints with full lifecycle tracking.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `communityId` | string | Yes | Parent community |
| `residentId` | string | Yes | Complaint author |
| `linkedServiceId` | string | No | Related service (if any) |
| `title` | string | Yes | Complaint title |
| `description` | string | Yes | Detailed description |
| `category` | string | Yes | Complaint category |
| `priority` | string | Yes | `low`, `medium`, `high`, `critical` |
| `status` | string | Yes | `open`, `in_progress`, `resolved`, `rejected` |
| `timeline` | array | Yes | List of `ComplaintTimelineEntry` |
| `internalNotes` | array | No | Admin-only notes (not visible to residents) |
| `createdAt` | timestamp | Yes | Auto-set |
| `updatedAt` | timestamp | Yes | Auto-updated |

### 6.8 `notifications`
Broadcast notifications from SuperAdmin to residents.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `communityId` | string | Yes | Parent community |
| `title` | string | Yes | Notification title |
| `message` | string | Yes | Notification body |
| `targetType` | string | Yes | `all`, `block`, `service` |
| `targetReferenceId` | string | No | Block name or service ID (when targeted) |
| `createdBy` | string | Yes | SuperAdmin UID |
| `readBy` | array | Yes | UIDs of users who have read it |
| `createdAt` | timestamp | Yes | Auto-set |

### 6.9 `documents`
Community-level documents (rules, guidelines, etc.).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `communityId` | string | Yes | Parent community |
| `title` | string | Yes | Document title |
| `fileUrl` | string | Yes | Download URL from Cloud Storage |
| `category` | string | Yes | `community_rules`, `service_guidelines`, `safety_instructions`, `notice` |
| `uploadedBy` | string | Yes | SuperAdmin UID |
| `createdAt` | timestamp | Yes | Auto-set |

### 6.10 `auditLogs`
Immutable audit trail for all significant actions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `communityId` | string | Yes | Parent community |
| `performedBy` | string | Yes | UID of actor |
| `role` | string | Yes | Role of actor at the time |
| `actionType` | string | Yes | What action was performed |
| `entityType` | string | Yes | Type of entity affected (e.g., `community`, `user`, `service`) |
| `entityId` | string | Yes | ID of the affected entity |
| `previousData` | map | No | State before the change |
| `newData` | map | No | State after the change |
| `timestamp` | timestamp | Yes | When the action occurred |

### 6.11 `serviceLogsArchive`
Archive destination for old service logs (moved by `archiveOldServiceLogs` scheduler).

Same schema as `serviceLogs`.

---

## 7. Security Model

### 7.1 Defense in Depth

The application enforces security at **three levels**:

| Level | Mechanism | Description |
|-------|-----------|-------------|
| **1. Network** | Helmet, CORS, Rate Limiting | HTTP security headers, cross-origin control, request throttling |
| **2. Application** | Express middleware | `authenticate()` → `requireRole()` → `requireServiceScope()` → `requirePermission()` |
| **3. Database** | Firestore security rules | Server-side rules enforce same checks — defense against direct Firestore access |

### 7.2 Authentication
- Firebase ID tokens (JWT) in `Authorization: Bearer <token>` header
- Tokens verified via Firebase Admin SDK (`auth.verifyIdToken()`)
- Custom claims set on user creation: `{ role, communityId }`
- Password hashing: bcryptjs with default salt rounds

### 7.3 Tenant Isolation
- Every Firestore document includes `communityId`
- `requireCommunityScope` middleware ensures requests can't cross community boundaries
- Firestore security rules enforce `sameCommunity()` on every collection
- Admin service scope: admins can only manage services in their `assignedServiceIds`

### 7.4 Rate Limiting
- **General API:** 200 requests per 15-minute window
- **Auth endpoints:** 20 requests per 15-minute window
- Applied via `express-rate-limit` at the route-group level

### 7.5 Input Validation
- All request bodies validated with Joi schemas before processing
- Type-safe validation via `validate<T>()` generic helper
- Rejects invalid/extra fields with descriptive error messages

### 7.6 File Upload Security
- **Multer** with memory storage (no disk writes in serverless)
- Cloud Storage rules enforce:
  - Content type restrictions (images vs PDFs)
  - File size limits (3 MB profiles, 5 MB logos, 20 MB documents)
  - Community-scoped paths

---

## 8. Complete API Reference

### Base URL
```
https://<region>-urbanaxis-app.cloudfunctions.net/api/v1
```
Local emulator: `http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1`

### Response Format

**Success:**
```json
{
  "success": true,
  "message": "Description of what happened",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "errorCode": "VALIDATION_ERROR",
  "message": "Detailed error description"
}
```

### Auth Endpoints (Public)

| # | Method | Endpoint | Body | Description |
|---|--------|----------|------|-------------|
| 1 | POST | `/auth/login` | `{ phone, password }` | Login with phone + password |
| 2 | POST | `/auth/register-request` | `{ phone, name, communityId, block, floor?, houseNumber }` | Submit registration request |
| 3 | POST | `/auth/verify-token` | `{ token }` | Verify a Firebase ID token |

### SuperAdmin Endpoints (29 routes)

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 1 | GET | `/superadmin/community` | Get community profile |
| 2 | PATCH | `/superadmin/community` | Update community profile |
| 3 | GET | `/superadmin/dashboard` | Get dashboard aggregations |
| 4 | GET | `/superadmin/residents` | List residents (filterable) |
| 5 | POST | `/superadmin/residents` | Add resident manually |
| 6 | POST | `/superadmin/residents/bulk-upload` | Bulk upload via CSV |
| 7 | GET | `/superadmin/residents/:id` | Get resident details |
| 8 | PATCH | `/superadmin/residents/:id` | Update resident profile |
| 9 | PATCH | `/superadmin/residents/:id/status` | Change resident status |
| 10 | GET | `/superadmin/admins` | List all admins |
| 11 | POST | `/superadmin/admins` | Create admin account |
| 12 | PATCH | `/superadmin/admins/:id` | Update admin account |
| 13 | GET | `/superadmin/admins/:id/activity` | Get admin activity log |
| 14 | GET | `/superadmin/services` | List services |
| 15 | POST | `/superadmin/services` | Create service |
| 16 | GET | `/superadmin/services/:id` | Get service details |
| 17 | PATCH | `/superadmin/services/:id` | Update service |
| 18 | PATCH | `/superadmin/services/:id/status` | Change service status |
| 19 | PATCH | `/superadmin/services/:id/assign-admins` | Assign admins to service |
| 20 | PATCH | `/superadmin/services/:id/visibility` | Update service visibility |
| 21 | GET | `/superadmin/complaints` | List all complaints |
| 22 | GET | `/superadmin/complaints/:id` | Get complaint details |
| 23 | PATCH | `/superadmin/complaints/:id/status` | Update complaint status |
| 24 | GET | `/superadmin/notifications` | List notifications |
| 25 | POST | `/superadmin/notifications` | Send notification |
| 26 | GET | `/superadmin/documents` | List documents |
| 27 | POST | `/superadmin/documents` | Upload document |
| 28 | DELETE | `/superadmin/documents/:id` | Delete document |
| 29 | GET | `/superadmin/audit-logs` | Query audit logs |

### Admin Endpoints (12 routes)

| # | Method | Endpoint | Required Permission | Description |
|---|--------|----------|---------------------|-------------|
| 1 | GET | `/admin/dashboard` | — | Admin dashboard |
| 2 | GET | `/admin/services/:id` | Service scope | Get assigned service |
| 3 | PATCH | `/admin/services/:id/status` | `canUpdateStatus` | Change service status |
| 4 | PATCH | `/admin/services/:id/occupancy` | `canManageOccupancy` | Adjust occupancy |
| 5 | PATCH | `/admin/services/:id/timings` | `canEditTimings` | Update timings |
| 6 | GET | `/admin/services/:id/logs` | Service scope | View service logs |
| 7 | POST | `/admin/services/:id/notices` | Service scope | Create notice |
| 8 | GET | `/admin/services/:id/notices` | Service scope | List notices |
| 9 | PATCH | `/admin/notices/:noticeId` | — | Update notice |
| 10 | GET | `/admin/complaints` | — | List complaints |
| 11 | PATCH | `/admin/complaints/:id/status` | `canResolveComplaints` | Update complaint status |
| 12 | PATCH | `/admin/complaints/:id/note` | — | Add internal note |

### Resident Endpoints (17 routes)

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 1 | GET | `/resident/dashboard` | Resident dashboard |
| 2 | GET | `/resident/services` | List visible services |
| 3 | GET | `/resident/services/:id` | Get service details + notices |
| 4 | POST | `/resident/services/:id/check-in` | Check into service |
| 5 | POST | `/resident/services/:id/check-out` | Check out of service |
| 6 | GET | `/resident/complaints` | List own complaints |
| 7 | POST | `/resident/complaints` | Create complaint |
| 8 | GET | `/resident/complaints/:id` | Get complaint details |
| 9 | PATCH | `/resident/complaints/:id/close` | Close own complaint |
| 10 | POST | `/resident/complaints/:id/comment` | Add comment |
| 11 | GET | `/resident/notifications` | List notifications |
| 12 | PATCH | `/resident/notifications/:id/read` | Mark as read |
| 13 | GET | `/resident/profile` | Get own profile |
| 14 | PATCH | `/resident/profile` | Update profile |
| 15 | POST | `/resident/profile/photo` | Upload profile photo |
| 16 | POST | `/resident/profile/request-house-change` | Request house change |
| 17 | GET | `/resident/documents` | List community documents |

---

## 9. Scheduled Jobs

| Job | Schedule | Timezone | Actions |
|-----|----------|----------|---------|
| `takeOccupancySnapshot` | Hourly | Asia/Kolkata | Snapshots current occupancy for all active services |
| `expireServiceNotices` | Daily 00:00 | Asia/Kolkata | Deactivates expired notices |
| `archiveOldServiceLogs` | Sunday 02:00 | Asia/Kolkata | Archives logs >90 days to `serviceLogsArchive` |
| `archiveOldSnapshots` | Sunday 03:00 | Asia/Kolkata | Deletes snapshots >30 days |
| `resetOccupancyAtMidnight` | Daily 23:59 | Asia/Kolkata | Resets all service occupancy counters to 0 |

---

## 10. Getting Started – Step-by-Step

### Prerequisites

- **Node.js 20** (LTS) — [Download](https://nodejs.org/)
- **Firebase CLI** — `npm install -g firebase-tools`
- **Java JDK 11+** — Required for Firebase Emulators
- **A Firebase project** — Create at [console.firebase.google.com](https://console.firebase.google.com)

### Step 1: Clone and Install

```bash
# Navigate to the project folder
cd UrbanAxiss

# Install Cloud Functions dependencies
cd functions
npm install
cd ..
```

### Step 2: Firebase Setup

```bash
# Login to Firebase
firebase login

# Link to your project (or create one)
firebase use --add
# Select your project and give it the alias "default"
```

> If your Firebase project ID differs from `urbanaxis-app`, update `.firebaserc` accordingly.

### Step 3: Enable Firebase Services

In the [Firebase Console](https://console.firebase.google.com):

1. **Authentication** → Sign-in methods → Enable **Phone** and **Email/Password**
2. **Firestore Database** → Create database (Start in **test mode** initially, then deploy rules)
3. **Storage** → Set up Cloud Storage
4. **Functions** → Requires Blaze (pay-as-you-go) plan

### Step 4: Service Account Key

1. Firebase Console → Project Settings → Service Accounts
2. Click **Generate New Private Key**
3. Save the JSON file securely
4. Create `functions/.env` from the template:

```bash
cd functions
cp .env.example .env
```

5. Fill in the values from your service account JSON:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-sa@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NODE_ENV=development
```

### Step 5: Build the Project

```bash
cd functions
npm run build
```

This compiles TypeScript from `src/` to JavaScript in `lib/`.

### Step 6: Deploy Firestore Rules & Indexes

```bash
# From the project root (UrbanAxiss/)
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

### Step 7: Seed Initial Data

```bash
cd functions
npx ts-node scripts/seed.ts
```

This creates:
- The "Sunrise Residency" community
- SuperAdmin account (phone: `+919123456789`, password: `Admin@1234`)
- 3 sample services (Gym, Pool, Party Hall)

### Step 8: Start Local Emulator (Development)

```bash
# From project root
firebase emulators:start --only functions,firestore,auth,storage
```

The API will be available at:
```
http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1
```

Emulator UI: `http://127.0.0.1:4000`

### Step 9: Deploy to Production

```bash
# From project root
firebase deploy
```

Or deploy only functions:
```bash
firebase deploy --only functions
```

---

## 11. Testing – Step-by-Step

### 11.1 Health Check

```bash
# Local emulator
curl http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/health

# Expected response:
# { "success": true, "message": "UrbanAxis API is running", "data": { "version": "1.0.0" } }
```

### 11.2 Login as SuperAdmin

```bash
curl -X POST http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919123456789", "password": "Admin@1234"}'

# Response includes a custom token. Exchange it for an ID token using
# Firebase Auth REST API (client-side typically handles this).
# Save the token for subsequent requests.
```

### 11.3 Get an ID Token (for testing)

After receiving the custom token from login, exchange it for an ID token:

```bash
# Use Firebase Auth REST API
curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=YOUR_WEB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"token": "CUSTOM_TOKEN_FROM_LOGIN", "returnSecureToken": true}'

# Save the "idToken" from the response
export TOKEN="<id-token-from-response>"
```

### 11.4 Test SuperAdmin Endpoints

```bash
# Get community profile
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/superadmin/community

# Get dashboard
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/superadmin/dashboard

# List services
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/superadmin/services

# Create an admin
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/superadmin/admins \
  -d '{
    "phone": "+919876543210",
    "name": "Gym Admin",
    "password": "GymAdmin@123",
    "assignedServiceIds": ["<service-id-from-seed>"],
    "permissions": {
      "canUpdateStatus": true,
      "canEditTimings": true,
      "canManageOccupancy": true,
      "canResolveComplaints": false
    }
  }'

# Add a resident manually
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/superadmin/residents \
  -d '{
    "phone": "+919111222333",
    "name": "John Doe",
    "block": "A",
    "floor": "3",
    "houseNumber": "A-301",
    "password": "Resident@123"
  }'

# Approve a pending resident
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/superadmin/residents/<resident-id>/status \
  -d '{"status": "active"}'

# Send a notification to all residents
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/superadmin/notifications \
  -d '{
    "title": "Welcome!",
    "message": "Welcome to Sunrise Residency community portal.",
    "targetType": "all"
  }'
```

### 11.5 Test Resident Endpoints

First, login as a resident and get their ID token (same flow as 11.2–11.3):

```bash
export RESIDENT_TOKEN="<resident-id-token>"

# Get resident dashboard
curl -H "Authorization: Bearer $RESIDENT_TOKEN" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/resident/dashboard

# List visible services
curl -H "Authorization: Bearer $RESIDENT_TOKEN" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/resident/services

# Check into a service (e.g., Gym)
curl -X POST -H "Authorization: Bearer $RESIDENT_TOKEN" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/resident/services/<service-id>/check-in

# Check out of a service
curl -X POST -H "Authorization: Bearer $RESIDENT_TOKEN" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/resident/services/<service-id>/check-out

# Create a complaint
curl -X POST -H "Authorization: Bearer $RESIDENT_TOKEN" \
  -H "Content-Type: application/json" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/resident/complaints \
  -d '{
    "title": "Gym equipment broken",
    "description": "The treadmill #3 is not working properly.",
    "category": "maintenance",
    "linkedServiceId": "<gym-service-id>",
    "priority": "medium"
  }'

# List my complaints
curl -H "Authorization: Bearer $RESIDENT_TOKEN" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/resident/complaints

# View notifications
curl -H "Authorization: Bearer $RESIDENT_TOKEN" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/resident/notifications

# Get my profile
curl -H "Authorization: Bearer $RESIDENT_TOKEN" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/resident/profile
```

### 11.6 Test Admin Endpoints

Login as an admin and get their ID token:

```bash
export ADMIN_TOKEN="<admin-id-token>"

# Get admin dashboard
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/admin/dashboard

# Get assigned service details
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/admin/services/<service-id>

# Change service status to maintenance
curl -X PATCH -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/admin/services/<service-id>/status \
  -d '{"status": "maintenance", "reason": "Weekly cleaning"}'

# Adjust occupancy manually
curl -X PATCH -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/admin/services/<service-id>/occupancy \
  -d '{"currentOccupancy": 15, "note": "Manual count correction"}'

# Create a service notice
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/admin/services/<service-id>/notices \
  -d '{
    "title": "Maintenance Notice",
    "message": "The pool will be closed for cleaning on Saturday.",
    "priority": "important",
    "expiresAt": "2025-01-20T00:00:00.000Z"
  }'

# List complaints for assigned services
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/admin/complaints
```

### 11.7 Test Bulk Upload (CSV)

Create a file `residents.csv`:

```csv
phone,name,block,floor,houseNumber
+919001001001,Alice Smith,A,1,A-101
+919001001002,Bob Jones,B,2,B-202
+919001001003,Carol Williams,C,3,C-303
```

Upload:

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -F "file=@residents.csv" \
  http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1/superadmin/residents/bulk-upload
```

### 11.8 Using Postman

1. Import the base URL as a Postman environment variable: `{{baseUrl}}` = `http://127.0.0.1:5001/urbanaxis-app/us-central1/api/v1`
2. Set `{{token}}` variable after login
3. Add `Authorization: Bearer {{token}}` to collection-level headers
4. Create requests for each endpoint listed in the API Reference (Section 8)

### 11.9 Running Linter

```bash
cd functions
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

---

## 12. Changes Made (Bug Fixes)

During the codebase audit, **2 bugs** were identified and fixed:

### Bug Fix 1: Invalid JSON Comments in `firestore.indexes.json`

**File:** `firestore.indexes.json`

**Problem:** The file contained JavaScript-style `//` comments at 11 locations (e.g., `// ── users ─────────`, `// ── services ──────────`, `// Disable single-field indexes...`). JSON does **not** support comments. This would cause `firebase deploy --only firestore:indexes` to fail with a JSON parse error.

**Fix:** Removed all `//` comment lines from the file. The JSON is now valid and will deploy correctly.

**Lines affected:** 11 comment lines removed throughout the file.

---

### Bug Fix 2: TypeScript Compile Error in `roleCheck.ts`

**File:** `functions/src/middleware/roleCheck.ts`

**Problem:** Line 85 had:
```typescript
export function requirePermission(
  permissionKey: keyof AuthenticatedRequest["user"]["permissions"] & string
)
```

Since `user` is an **optional** property on `AuthenticatedRequest` (`user?:`), TypeScript cannot index into `undefined["permissions"]`. This causes a compile-time type error.

**Fix:** 
1. Added `AdminPermissions` to the import statement:
   ```typescript
   import { AdminPermissions, AuthenticatedRequest, UserRole } from "../models/types";
   ```
2. Changed the parameter type to reference `AdminPermissions` directly:
   ```typescript
   export function requirePermission(
     permissionKey: keyof AdminPermissions
   )
   ```

This correctly types the parameter as one of: `"canUpdateStatus" | "canEditTimings" | "canManageOccupancy" | "canResolveComplaints"`.

---

*End of Documentation*
