const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");

initializeApp();
setGlobalOptions({ region: "us-central1", maxInstances: 10 });

const db = getFirestore();
const ALLOWED_REQUEST_ROLES = new Set(["student", "parent"]);

function requireUser(request) {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in is required.");
  return request.auth;
}

function requireApprover(request) {
  const auth = requireUser(request);
  const role = auth.token.role;
  if (!["mainTeacher", "superAdmin"].includes(role) || auth.token.accountStatus !== "active") {
    throw new HttpsError("permission-denied", "Only an active main teacher or super admin can review access requests.");
  }
  return auth;
}

function cleanText(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function assertSystemWritable() {
  const snap = await db.doc("developerSettings/global").get();
  const settings = snap.exists ? snap.data() : {};
  if (settings.readOnly) throw new HttpsError("failed-precondition", "The platform is currently in read-only mode.");
  if (settings.emergencyMode) throw new HttpsError("unavailable", "The platform is temporarily in emergency mode.");
  return settings;
}

exports.requestAccountAccess = onCall(async (request) => {
  const auth = requireUser(request);
  const controls = await assertSystemWritable();
  if (controls.loginLockdown && auth.token.role !== "developer") {
    throw new HttpsError("permission-denied", "Platform sign-in access is temporarily restricted.");
  }
  const uid = auth.uid;
  if (auth.token.role) {
    throw new HttpsError("already-exists", "This account already has an assigned role. Contact the teacher if it needs to change.");
  }
  if (auth.token.email_verified !== true) {
    throw new HttpsError("failed-precondition", "Verify your email address before requesting account access.");
  }
  const requestedRole = request.data?.requestedRole;
  const displayName = cleanText(request.data?.displayName, 80);

  if (!ALLOWED_REQUEST_ROLES.has(requestedRole)) {
    throw new HttpsError("invalid-argument", "Only student or parent access requests are accepted.");
  }
  if (displayName.length < 2) {
    throw new HttpsError("invalid-argument", "Enter a name with at least 2 characters.");
  }

  const profileRef = db.doc(`userProfiles/${uid}`);
  const requestRef = db.doc(`accessRequests/${uid}`);

  await db.runTransaction(async (tx) => {
    const [profileSnap, requestSnap] = await Promise.all([tx.get(profileRef), tx.get(requestRef)]);
    if (profileSnap.exists && profileSnap.get("status") === "active") {
      throw new HttpsError("already-exists", "This account already has an active role.");
    }
    if (requestSnap.exists && requestSnap.get("status") === "pending") {
      throw new HttpsError("already-exists", "Your access request is already waiting for review.");
    }
    if (requestSnap.exists) {
      const lastUpdated = requestSnap.get("updatedAt");
      if (lastUpdated?.toMillis && Date.now() - lastUpdated.toMillis() < 5 * 60 * 1000) {
        throw new HttpsError("resource-exhausted", "Please wait five minutes before submitting another request.");
      }
    }

    const requestData = {
      uid,
      email: auth.token.email || null,
      displayName,
      requestedRole,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    tx.set(requestRef, requestData);
    tx.set(profileRef, {
      uid,
      email: auth.token.email || null,
      displayName,
      role: null,
      status: "pending",
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    tx.set(db.collection("auditEvents").doc(), {
      type: "account_access_requested",
      actorUid: uid,
      targetUid: uid,
      requestedRole,
      createdAt: FieldValue.serverTimestamp()
    });
  });

  return { status: "pending", message: "Your request was submitted for teacher review." };
});

exports.getMyAccountStatus = onCall(async (request) => {
  const auth = requireUser(request);
  const controlsSnap = await db.doc("developerSettings/global").get();
  const controls = controlsSnap.exists ? controlsSnap.data() : {};
  if (controls.loginLockdown && auth.token.role !== "developer") {
    throw new HttpsError("permission-denied", "Platform sign-in access is temporarily restricted.");
  }
  const [profileSnap, requestSnap] = await Promise.all([
    db.doc(`userProfiles/${auth.uid}`).get(),
    db.doc(`accessRequests/${auth.uid}`).get()
  ]);
  const profile = profileSnap.exists ? profileSnap.data() : null;
  const accessRequest = requestSnap.exists ? requestSnap.data() : null;

  return {
    status: profile?.status || accessRequest?.status || "unrequested",
    role: profile?.role || auth.token.role || null,
    requestedRole: accessRequest?.requestedRole || null,
    displayName: profile?.displayName || accessRequest?.displayName || null,
    reviewedAt: profile?.reviewedAt?.toDate?.().toISOString?.() || null,
    canReviewRequests: ["mainTeacher", "superAdmin"].includes(auth.token.role) && auth.token.accountStatus === "active",
    platformControls: { maintenance: controls.maintenance === true, readOnly: controls.readOnly === true, emergencyMode: controls.emergencyMode === true }
  };
});

exports.listPendingAccessRequests = onCall(async (request) => {
  requireApprover(request);
  const snapshot = await db.collection("accessRequests")
    .where("status", "==", "pending")
    .orderBy("createdAt", "asc")
    .limit(50)
    .get();

  return {
    requests: snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email || "",
        displayName: data.displayName || "",
        requestedRole: data.requestedRole,
        createdAt: data.createdAt?.toDate?.().toISOString?.() || null
      };
    })
  };
});

exports.reviewAccessRequest = onCall(async (request) => {
  const reviewer = requireApprover(request);
  await assertSystemWritable();
  const targetUid = cleanText(request.data?.uid, 128);
  const decision = request.data?.decision;
  if (!targetUid || targetUid === reviewer.uid) {
    throw new HttpsError("invalid-argument", "A valid different account UID is required.");
  }
  if (!["approve", "reject"].includes(decision)) {
    throw new HttpsError("invalid-argument", "Decision must be approve or reject.");
  }

  const requestRef = db.doc(`accessRequests/${targetUid}`);
  const profileRef = db.doc(`userProfiles/${targetUid}`);
  const data = await db.runTransaction(async (tx) => {
    const requestSnap = await tx.get(requestRef);
    if (!requestSnap.exists || requestSnap.get("status") !== "pending") {
      throw new HttpsError("failed-precondition", "This request is no longer pending or is already being reviewed.");
    }
    const pendingData = requestSnap.data();
    if (!ALLOWED_REQUEST_ROLES.has(pendingData.requestedRole)) {
      throw new HttpsError("failed-precondition", "The requested role is not eligible for this approval workflow.");
    }
    tx.update(requestRef, {
      status: "reviewing",
      reviewStartedBy: reviewer.uid,
      reviewStartedAt: FieldValue.serverTimestamp()
    });
    return pendingData;
  });

  let previousClaims = null;
  if (decision === "approve") {
    try {
      const user = await getAuth().getUser(targetUid);
      previousClaims = user.customClaims || {};
      if (previousClaims.role) {
        throw new HttpsError("failed-precondition", "This account already has a role and requires a separate review.");
      }
      await getAuth().setCustomUserClaims(targetUid, {
        ...previousClaims,
        role: data.requestedRole,
        accountStatus: "active"
      });
    } catch (error) {
      await requestRef.update({
        status: "pending",
        reviewStartedBy: FieldValue.delete(),
        reviewStartedAt: FieldValue.delete()
      });
      throw error;
    }
  }

  const finalStatus = decision === "approve" ? "active" : "rejected";
  const reviewedAt = FieldValue.serverTimestamp();
  const batch = db.batch();
  batch.update(requestRef, {
    status: finalStatus,
    reviewedBy: reviewer.uid,
    reviewedAt,
    updatedAt: reviewedAt,
    reviewStartedBy: FieldValue.delete(),
    reviewStartedAt: FieldValue.delete()
  });
  batch.set(profileRef, {
    uid: targetUid,
    email: data.email || null,
    displayName: data.displayName,
    role: decision === "approve" ? data.requestedRole : null,
    status: finalStatus,
    reviewedBy: reviewer.uid,
    reviewedAt,
    createdAt: data.createdAt || reviewedAt,
    updatedAt: reviewedAt
  }, { merge: true });
  batch.set(db.collection("auditEvents").doc(), {
    type: decision === "approve" ? "account_access_approved" : "account_access_rejected",
    actorUid: reviewer.uid,
    targetUid,
    assignedRole: decision === "approve" ? data.requestedRole : null,
    createdAt: reviewedAt
  });
  try {
    await batch.commit();
  } catch (error) {
    if (decision === "approve" && previousClaims) {
      await getAuth().setCustomUserClaims(targetUid, previousClaims);
    }
    await requestRef.update({
      status: "pending",
      reviewStartedBy: FieldValue.delete(),
      reviewStartedAt: FieldValue.delete()
    });
    throw error;
  }

  return { status: finalStatus };
});

// Secure Developer-only callable functions. Firestore client rules remain deny-all.
Object.assign(exports, require("./developer"));
