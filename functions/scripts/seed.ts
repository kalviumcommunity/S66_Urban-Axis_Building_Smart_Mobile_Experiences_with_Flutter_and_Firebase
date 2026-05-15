/**
 * UrbanAxis – Seed Script
 * Run once to create the initial community and SuperAdmin account.
 *
 * Usage:
 *   npx ts-node scripts/seed.ts
 */

import * as admin from "firebase-admin";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const projectId = process.env.PROJECT_ID || "urbanaxis-app";

// Check if we are running against emulators
const isEmulator = process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (isEmulator) {
  console.log("🛠️  Connecting to Emulators...");
  // When using emulators, we can initialize with just the projectId
  // The Admin SDK will look for FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST
  admin.initializeApp({
    projectId: projectId,
  });
} else {
  // Try to use environment variables for real Firebase project
  if (process.env.CLIENT_EMAIL && process.env.PRIVATE_KEY) {
    console.log("Using credentials from .env for Project: " + projectId);
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: process.env.CLIENT_EMAIL,
        privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    console.error("❌  Error: Missing credentials in .env (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY)");
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();
const Timestamp = admin.firestore.Timestamp;

async function seed() {
  console.log("🌱  Starting UrbanAxis seed...");

  // ──────────────────────────────────────────────
  //  1. Create Community
  // ──────────────────────────────────────────────
  const communityRef = db.collection("communities").doc();
  const communityId = communityRef.id;
  const now = Timestamp.now();

  await communityRef.set({
    name: "Sunrise Residency",
    address: "123 Main Street, Bangalore, Karnataka 560001",
    logoUrl: "",
    emergencyContacts: [
      { name: "Security", phone: "+919999999999", role: "Security Officer" },
      { name: "Maintenance", phone: "+918888888888", role: "Maintenance Head" },
    ],
    blocks: ["A", "B", "C", "D"],
    contactDetails: {
      email: "office@sunriseresidency.in",
      phone: "+918000000000",
    },
    configurationSettings: {},
    createdAt: now,
    updatedAt: now,
  });

  console.log(`✅  Community created: ${communityId}`);

  // ──────────────────────────────────────────────
  //  2. Create SuperAdmin
  // ──────────────────────────────────────────────
  const superadminPhone = "+919123456789"; 
  const superadminPassword = "Admin@1234";   

  // Check if user already exists
  let firebaseUser;
  try {
    firebaseUser = await auth.getUserByPhoneNumber(superadminPhone);
    console.log(`ℹ️  SuperAdmin user already exists: ${firebaseUser.uid}`);
  } catch (err) {
    firebaseUser = await auth.createUser({
      phoneNumber: superadminPhone,
      displayName: "Super Admin",
    });
    console.log(`✅  SuperAdmin auth user created: ${firebaseUser.uid}`);
  }

  const passwordHash = await bcrypt.hash(superadminPassword, 10);

  await db.collection("users").doc(firebaseUser.uid).set({
    communityId,
    name: "Super Admin",
    phone: superadminPhone,
    passwordHash,
    role: "superadmin",
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  // For the emulator, custom claims are handled locally
  await auth.setCustomUserClaims(firebaseUser.uid, {
    role: "superadmin",
    communityId,
  });

  console.log(`✅  SuperAdmin document created.`);
  console.log(`    Phone   : ${superadminPhone}`);
  console.log(`    Password: ${superadminPassword}`);
  console.log(`    Community ID: ${communityId}`);

  // ──────────────────────────────────────────────
  //  3. Seed Sample Services
  // ──────────────────────────────────────────────
  const services = [
    {
      name: "Block A Gym",
      type: "gym",
      description: "Fully equipped gymnasium with cardio and weight training equipment.",
      maxCapacity: 30,
      operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      operatingHours: { open: "06:00", close: "22:00" },
      location: "Block A, Ground Floor",
      rules: [
        "Valid community ID required for entry",
        "Proper sportswear mandatory",
        "Wipe equipment after use",
        "No food or beverages inside",
      ],
    },
    {
      name: "Swimming Pool",
      type: "pool",
      description: "Olympic-size swimming pool with separate kids area.",
      maxCapacity: 50,
      operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      operatingHours: { open: "06:00", close: "20:00" },
      location: "Central Area, Block B side",
      rules: [
        "Swimwear mandatory",
        "No diving in shallow area",
        "Children below 10 must be accompanied by adults",
        "No glass items near pool",
      ],
    },
    {
      name: "Party Hall",
      type: "party_hall",
      description: "Air-conditioned party hall for community events.",
      maxCapacity: 150,
      operatingDays: ["Friday", "Saturday", "Sunday"],
      operatingHours: { open: "09:00", close: "23:00" },
      location: "Block C, First Floor",
      rules: [
        "Prior booking required through Admin",
        "Music must stop by 10 PM",
        "Clean-up responsibility on resident",
      ],
    },
  ];

  for (const svc of services) {
    const ref = db.collection("services").doc();
    await ref.set({
      communityId,
      ...svc,
      currentOccupancy: 0,
      status: "active",
      assignedAdminIds: [],
      visibilitySettings: { isVisible: true },
      maintenanceSchedule: null,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`✅  Service created: ${svc.name} (${ref.id})`);
  }

  console.log("\n🎉  Seed complete! You can now log in with the SuperAdmin credentials.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
