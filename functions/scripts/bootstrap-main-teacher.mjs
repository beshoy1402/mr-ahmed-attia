import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || "mr-ahmed-attia-12345";
const uid = process.env.MAIN_TEACHER_UID;
if (!uid) {
  console.error("Set MAIN_TEACHER_UID to the Firebase Auth UID of the verified teacher account.");
  process.exit(1);
}

initializeApp({ credential: applicationDefault(), projectId });
const auth = getAuth();
const db = getFirestore();
const user = await auth.getUser(uid);
if (!user.emailVerified) {
  throw new Error("Verify the teacher's email in Firebase Authentication before bootstrapping.");
}

const markerRef = db.doc("system/bootstrap");
let alreadyActive = false;
await db.runTransaction(async (tx) => {
  const marker = await tx.get(markerRef);
  if (marker.exists && marker.get("mainTeacherUid") !== uid) {
    throw new Error("A main teacher has already been bootstrapped. Do not overwrite the existing owner.");
  }
  if (marker.exists && marker.get("status") === "active") {
    alreadyActive = true;
    return;
  }
  tx.set(markerRef, {
    mainTeacherUid: uid,
    status: "provisioning",
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
});
if (alreadyActive) {
  console.log("This UID is already the bootstrapped main teacher.");
  process.exit(0);
}

const existingClaims = user.customClaims || {};
if (existingClaims.role && existingClaims.role !== "mainTeacher") {
  throw new Error("The account already has a role. Review it manually before proceeding.");
}
await auth.setCustomUserClaims(uid, {
  ...existingClaims,
  role: "mainTeacher",
  accountStatus: "active"
});

const batch = db.batch();
batch.set(db.doc(`userProfiles/${uid}`), {
  uid,
  email: user.email || null,
  displayName: user.displayName || user.email || "Main Teacher",
  role: "mainTeacher",
  status: "active",
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp()
}, { merge: true });
batch.set(db.collection("auditEvents").doc(), {
  type: "main_teacher_bootstrapped",
  actorUid: uid,
  targetUid: uid,
  createdAt: FieldValue.serverTimestamp()
});
batch.set(markerRef, {
  mainTeacherUid: uid,
  status: "active",
  updatedAt: FieldValue.serverTimestamp()
}, { merge: true });
await batch.commit();

console.log(`Main Teacher role assigned to ${user.email || uid}. Sign out and sign in again to refresh the ID token.`);
