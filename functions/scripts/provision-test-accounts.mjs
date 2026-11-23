import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const PROJECT_ID = "mr-ahmed-attia-12345";
const APPLY = process.argv.includes("--apply");
const ACCOUNTS = [
  { email: "student@gmail.com", role: "student", label: "Student" },
  { email: "parent@gmail.com", role: "parent", label: "Parent" },
  { email: "teacher@gmail.com", role: "teacher", label: "Teacher" },
  { email: "assistant@gmail.com", role: "assistant", label: "Assistant" },
  { email: "admin@gmail.com", role: "superAdmin", label: "Administrator" }
];

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID !== PROJECT_ID) {
  throw new Error(`Refusing to run against unexpected project: ${process.env.FIREBASE_PROJECT_ID}`);
}
initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const auth = getAuth();
const db = getFirestore();

const users = [];
for (const account of ACCOUNTS) {
  const user = await auth.getUserByEmail(account.email).catch((error) => {
    if (error.code === "auth/user-not-found") {
      throw new Error(`Missing Firebase Authentication user: ${account.email}. Create it before running this script.`);
    }
    throw error;
  });
  // These five addresses are explicitly preconfigured test accounts.
  // Email verification is intentionally not required for this one-time trusted-admin
  // provisioning script. Only run it when you control all five accounts.
  if (user.disabled) throw new Error(`Disabled account cannot be provisioned: ${account.email}`);
  if (user.customClaims?.role && user.customClaims.role !== account.role) {
    throw new Error(`Refusing to overwrite existing role "${user.customClaims.role}" for ${account.email}`);
  }
  users.push({ ...account, user, previousClaims: user.customClaims || {} });
}

const markerRef = db.doc("system/testAccountProvisioning");
const marker = await markerRef.get();
if (marker.exists && marker.get("status") === "completed") {
  throw new Error("The test-account provisioning script has already completed. Use a reviewed manual migration to change roles.");
}

console.log(`Target Firebase project: ${PROJECT_ID}`);
for (const entry of users) console.log(`${entry.email} -> ${entry.label} (${entry.role}) [UID: ${entry.user.uid}]`);
if (!APPLY) {
  console.log("\nDry run only. Verify every email and role above, then rerun with --apply to make changes.");
  process.exit(0);
}

const changed = [];
try {
  for (const entry of users) {
    await auth.setCustomUserClaims(entry.user.uid, {
      ...entry.previousClaims,
      role: entry.role,
      accountStatus: "active"
    });
    changed.push(entry);
  }

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();
  for (const entry of users) {
    batch.set(db.doc(`userProfiles/${entry.user.uid}`), {
      uid: entry.user.uid,
      email: entry.user.email,
      displayName: entry.user.displayName || entry.label,
      role: entry.role,
      status: "active",
      provisionedBy: "trusted_test_account_script",
      createdAt: now,
      updatedAt: now
    }, { merge: true });
    batch.set(db.collection("auditEvents").doc(), {
      type: "test_account_role_provisioned",
      actorUid: "trusted_admin_script",
      targetUid: entry.user.uid,
      targetEmail: entry.user.email,
      assignedRole: entry.role,
      createdAt: now
    });
  }
  batch.set(markerRef, {
    status: "completed",
    projectId: PROJECT_ID,
    accountEmails: ACCOUNTS.map((account) => account.email),
    updatedAt: now
  }, { merge: true });
  await batch.commit();
} catch (error) {
  for (const entry of changed.reverse()) {
    await auth.setCustomUserClaims(entry.user.uid, entry.previousClaims).catch((rollbackError) => {
      console.error(`CRITICAL: claim rollback failed for ${entry.email}:`, rollbackError.message);
    });
  }
  throw error;
}

console.log("\nAll five roles were assigned. Each user must sign out and sign in again to refresh their Firebase ID token.");
console.log("This grants dashboard identity only. It does not grant access to student records, courses, payments, or files.");
