/**
 * UrbanAxis – Seed Script
 * Run once to create the initial community and SuperAdmin account.
 *
 * Usage:
 *   npx ts-node scripts/seed.ts
 *
 * Requires: Firebase Admin SDK service account key at ./serviceAccountKey.json
 */

import * as admin from "firebase-admin";
import * as bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import * as path from "path";

const serviceAccount = JSON.parse(
  readFileSync(path.resolve(__dirname, "../serviceAccountKey.json"), "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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
  const superadminPhone = "+919123456789"; // Change to actual phone number
  const superadminPassword = "Admin@1234";   // Change before deploying

  const firebaseUser = await auth.createUser({
    phoneNumber: superadminPhone,
    displayName: "Super Admin",
  });

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

  await auth.setCustomUserClaims(firebaseUser.uid, {
    role: "superadmin",
    communityId,
  });

  console.log(`✅  SuperAdmin created: ${firebaseUser.uid}`);
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
