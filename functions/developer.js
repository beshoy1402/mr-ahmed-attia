const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

const db = getFirestore();
const ROLES = ["student", "parent", "teacher", "assistant", "superAdmin", "developer"];
const FEATURES = [
  ["feature.enable-disable","Enable or disable every website feature","Feature Management Center"],
  ["feature.hide","Hide a feature completely","Feature Management Center"],
  ["feature.unavailable","Show a feature as unavailable","Feature Management Center"],
  ["feature.independent","Independent feature controls","Feature Management Center"],
  ["feature.subfeatures","Independent subfeature controls","Feature Management Center"],
  ["feature.role-access","Role-specific feature access","Feature Management Center"],
  ["feature.global-disable","Global feature disable","Feature Management Center"],
  ["feature.scheduling","Scheduled activation and deactivation","Feature Management Center"],
  ["feature.preserve-data","Preserve data while disabled","Feature Management Center"],
  ["feature.restore","Restore previous feature configuration","Feature Management Center"],
  ["feature.dependencies","Dependency warnings","Feature Management Center"],
  ["feature.bulk","Bulk feature controls","Feature Management Center"],
  ["client.independent-config","Independent client configurations","Client Customization"],
  ["client.packages","Client feature packages","Client Customization"],
  ["client.templates","Reusable configuration templates","Client Customization"],
  ["client.copy-config","Copy configuration between clients","Client Customization"],
  ["client.navigation","Client-specific dashboard navigation","Client Customization"],
  ["client.role-access","Client-specific role access","Client Customization"],
  ["client.requests","Client feature requests","Client Customization"],
  ["client.approval","Developer approval for feature requests","Client Customization"],
  ["dev.separate-dashboard","Separate Developer Dashboard","Developer Dashboard"],
  ["monitor.health","Website health overview","Developer Dashboard"],
  ["monitor.firestore","Firebase database status and usage","Developer Dashboard"],
  ["monitor.auth","Authentication activity and account statistics","Developer Dashboard"],
  ["monitor.performance","Website performance statistics","Developer Dashboard"],
  ["monitor.integrations","API and integration status","Developer Dashboard"],
  ["settings.website","Website settings","Developer Dashboard"],
  ["settings.branding","Branding, colors, images and layout","Developer Dashboard"],
  ["maintenance.mode","Maintenance mode","Developer Dashboard"],
  ["maintenance.announcements","Maintenance announcements","Developer Dashboard"],
  ["security.developer-only","Developer-only settings","Security and Access"],
  ["security.admin-feature-lock","Prevent Administrator feature overrides","Security and Access"],
  ["security.admin-accounts","Administrator educational account management","Security and Access"],
  ["security.create-admin","Developer can create Administrator accounts","Security and Access"],
  ["security.deactivate-accounts","Deactivate accounts except own account","Security and Access"],
  ["security.password-confirm","Password confirmation for sensitive actions","Security and Access"],
  ["security.strong-confirm","Additional destructive-action confirmation","Security and Access"],
  ["security.audit","Developer audit log","Security and Access"],
  ["security.login-history","User login history","Security and Access"],
  ["security.suspicious-alerts","Suspicious activity alerts","Security and Access"],
  ["recovery.manual-backup","Manual database backup","Backups and Recovery"],
  ["recovery.scheduled-backup","Scheduled automatic backups","Backups and Recovery"],
  ["recovery.restore","Restore database backups","Backups and Recovery"],
  ["recovery.disaster-center","Disaster Recovery Center","Backups and Recovery"],
  ["recovery.export","Website data exports","Backups and Recovery"],
  ["recovery.history","Backup and recovery history","Backups and Recovery"],
  ["release.versions","Website version management","Development and Deployment"],
  ["release.history","Deployment history","Development and Deployment"],
  ["release.rollback","Rollback to a previous version","Development and Deployment"],
  ["release.test-mode","Test mode before activation","Development and Deployment"],
  ["release.beta-users","Beta features for selected users","Development and Deployment"],
  ["dev.bug-reports","Bug reporting","Development and Deployment"],
  ["dev.tasks","Technical task management","Development and Deployment"],
  ["monitor.logs","System logs and error details","Development and Deployment"],
  ["settings.environment","Secure environment and integration settings","Development and Deployment"],
  ["global.emergency","Emergency switch for nonessential features","Global Control"],
  ["global.read-only","Read-only mode","Global Control"],
  ["global.login-lockdown","Temporary login lockdown","Global Control"],
  ["dev.extensible-registry","Extensible feature registry","Global Control"],
  ["dev.dashboard-separation","Separate Developer and Administrator dashboards","Global Control"]
].map(([id, name, category]) => ({ id, name, category, optional: true, dependencies: [] }));
const DEPENDENCIES = { "client.copy-config":["client.independent-config"], "client.packages":["feature.independent"], "recovery.restore":["recovery.manual-backup"], "recovery.disaster-center":["recovery.manual-backup"], "release.rollback":["release.history"], "maintenance.announcements":["maintenance.mode"] };
FEATURES.forEach((feature) => { feature.dependencies = DEPENDENCIES[feature.id] || []; });

function requireDeveloper(request) {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in is required.");
  if (request.auth.token.role !== "developer" || request.auth.token.accountStatus !== "active") {
    throw new HttpsError("permission-denied", "An active Developer account is required.");
  }
  return request.auth;
}
function clean(value, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
async function assertFeatureEnabled(featureId, role, clientId = null) {
  featureById(featureId);
  const [snap, globalSnap] = await Promise.all([db.doc("developerFeatureSettings/" + featureId).get(), db.doc("developerSettings/global").get()]);
  const config = snap.exists ? snap.data() : {};
  const globalSettings = globalSnap.exists ? globalSnap.data() : {};
  if (globalSettings.emergencyMode && !["dev.separate-dashboard", "security.developer-only"].includes(featureId)) {
    throw new HttpsError("unavailable", "The platform is temporarily in emergency mode.");
  }
  if (config.enabled === false || config.visibility === "hidden" || config.visibility === "unavailable") {
    throw new HttpsError("unavailable", "This capability is currently disabled.");
  }
  if (config.roleAccess?.[role] === false) {
    throw new HttpsError("permission-denied", "Your role cannot use this capability.");
  }
  const client = clientId && config.clientOverrides?.[clientId];
  if (client && (client.enabled === false || client.visibility === "hidden" || client.visibility === "unavailable" || client.roleAccess?.[role] === false)) {
    throw new HttpsError("unavailable", "This capability is not enabled for this client.");
  }
  const schedule = config.schedule || {};
  const now = Date.now();
  if (schedule.startsAt && now < Date.parse(schedule.startsAt)) throw new HttpsError("unavailable", "This capability is not active yet.");
  if (schedule.endsAt && now >= Date.parse(schedule.endsAt)) throw new HttpsError("unavailable", "This capability's scheduled access has ended.");
}
function featureById(id) {
  const feature = FEATURES.find((item) => item.id === id);
  if (!feature) throw new HttpsError("invalid-argument", "Unknown feature ID.");
  return feature;
}
async function audit(actor, type, target, metadata = {}) {
  await db.collection("auditEvents").add({
    type, actorUid: actor.uid, actorEmail: actor.token.email || null,
    actorRole: "developer", target: clean(target, 180), metadata,
    createdAt: FieldValue.serverTimestamp()
  });
}

exports.getDeveloperConsole = onCall(async (request) => {
  const actor = requireDeveloper(request);
  const [featureSnap, templateSnap, settingsSnap, requestSnap, auditSnap] = await Promise.all([
    db.collection("developerFeatureSettings").get(),
    db.collection("developerFeatureTemplates").orderBy("updatedAt", "desc").limit(30).get(),
    db.doc("developerSettings/global").get(),
    db.collection("developerFeatureRequests").orderBy("createdAt", "desc").limit(30).get(),
    db.collection("auditEvents").orderBy("createdAt", "desc").limit(30).get()
  ]);
  const configs = Object.fromEntries(featureSnap.docs.map((doc) => [doc.id, doc.data()]));
  return {
    features: FEATURES,
    configs,
    templates: templateSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    settings: settingsSnap.exists ? settingsSnap.data() : {},
    requests: requestSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate?.().toISOString?.() || null })),
    audit: auditSnap.docs.filter((doc) => doc.data().actorRole === "developer").map((doc) => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate?.().toISOString?.() || null })),
    integrations: {
      firebase: { status: "connected", detail: "Callable backend authenticated" },
      firestoreMetrics: { status: "not-configured", detail: "Enable Cloud Monitoring metrics and grant a read-only metrics integration to display live usage." },
      authMetrics: { status: "partial", detail: "Authentication user counts can be queried; historical sign-in analytics require a configured logging export." },
      performance: { status: "not-configured", detail: "Connect Firebase Performance Monitoring or an approved telemetry provider." },
      vercel: { status: "external", detail: "Deployment history is managed in the connected Vercel project." },
      backups: { status: "not-configured", detail: "Configure scheduled Firestore exports to a secured Cloud Storage bucket before enabling restore operations." }
    },
    currentDeveloper: { uid: actor.uid, email: actor.token.email || null }
  };
});

exports.updateDeveloperFeature = onCall(async (request) => {
  const actor = requireDeveloper(request);
  const id = clean(request.data?.featureId, 100);
  const feature = featureById(id);
  const input = request.data?.config || {};
  const config = {};
  const clientId = clean(input.clientId, 80);
  if (!clientId) {
    if (typeof input.enabled === "boolean") config.enabled = input.enabled;
    if (input.visibility && ["visible", "hidden", "unavailable"].includes(input.visibility)) config.visibility = input.visibility;
    if (input.roleAccess && typeof input.roleAccess === "object" && !Array.isArray(input.roleAccess)) {
      config.roleAccess = Object.fromEntries(ROLES.map((role) => [role, input.roleAccess[role] !== false]));
    }
  } else {
    if (!/^[a-zA-Z0-9_-]+$/.test(clientId)) throw new HttpsError("invalid-argument", "Invalid client ID.");
    const current = (await db.doc("developerFeatureSettings/" + id).get()).data() || {};
    const overrides = { ...(current.clientOverrides || {}) };
    overrides[clientId] = {
      enabled: typeof input.clientEnabled === "boolean" ? input.clientEnabled : true,
      visibility: ["visible", "hidden", "unavailable"].includes(input.clientVisibility) ? input.clientVisibility : "visible",
      roleAccess: input.roleAccess && typeof input.roleAccess === "object"
        ? Object.fromEntries(ROLES.map((role) => [role, input.roleAccess[role] !== false]))
        : (overrides[clientId]?.roleAccess || {})
    };
    config.clientOverrides = overrides;
  }
  if (input.schedule && typeof input.schedule === "object") {
    const startsAt = input.schedule.startsAt ? new Date(input.schedule.startsAt) : null;
    const endsAt = input.schedule.endsAt ? new Date(input.schedule.endsAt) : null;
    if ((startsAt && Number.isNaN(startsAt.getTime())) || (endsAt && Number.isNaN(endsAt.getTime())) || (startsAt && endsAt && endsAt <= startsAt)) {
      throw new HttpsError("invalid-argument", "The feature schedule is invalid.");
    }
    config.schedule = { startsAt: startsAt?.toISOString() || null, endsAt: endsAt?.toISOString() || null };
  }
  if (input.subfeatures && typeof input.subfeatures === "object" && !Array.isArray(input.subfeatures)) {
    config.subfeatures = Object.fromEntries(Object.entries(input.subfeatures).slice(0, 50).map(([key, value]) => [clean(key, 80), value === true]));
  }
  if (!Object.keys(config).length) throw new HttpsError("invalid-argument", "No valid feature settings were provided.");
  if (config.enabled === false) {
    const dependents = FEATURES.filter((candidate) => candidate.dependencies.includes(id));
    const activeDependents = [];
    for (const dependent of dependents) {
      const snap = await db.doc("developerFeatureSettings/" + dependent.id).get();
      if (!snap.exists || snap.get("enabled") !== false) activeDependents.push(dependent.name);
    }
    if (activeDependents.length) throw new HttpsError("failed-precondition", "Disable dependent features first: " + activeDependents.join(", "));
  }
  const ref = db.doc("developerFeatureSettings/" + id);
  await ref.set({ ...config, featureId: id, featureName: feature.name, updatedBy: actor.uid, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await audit(actor, "developer_feature_updated", id, { ...config, clientId: clientId || null });
  return { success: true };
});

exports.bulkUpdateDeveloperFeatures = onCall(async (request) => {
  const actor = requireDeveloper(request);
  const enabled = request.data?.enabled;
  if (typeof enabled !== "boolean") throw new HttpsError("invalid-argument", "enabled must be true or false.");
  const batch = db.batch();
  FEATURES.forEach((feature) => {
    batch.set(db.doc("developerFeatureSettings/" + feature.id), {
      enabled, featureId: feature.id, featureName: feature.name,
      updatedBy: actor.uid, updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });
  await batch.commit();
  await audit(actor, "developer_features_bulk_updated", "all", { enabled, count: FEATURES.length });
  return { success: true, count: FEATURES.length };
});

exports.saveDeveloperFeatureTemplate = onCall(async (request) => {
  const actor = requireDeveloper(request);
  const name = clean(request.data?.name, 80);
  const clientId = clean(request.data?.clientId, 80);
  if (name.length < 2) throw new HttpsError("invalid-argument", "Template name is required.");
  const snapshot = await db.collection("developerFeatureSettings").get();
  const features = Object.fromEntries(snapshot.docs.map((doc) => {
    const stored = doc.data();
    const clientConfig = clientId ? stored.clientOverrides?.[clientId] : null;
    return [doc.id, clientConfig ? { enabled: clientConfig.enabled, visibility: clientConfig.visibility, roleAccess: clientConfig.roleAccess || {} } : stored];
  }));
  const ref = await db.collection("developerFeatureTemplates").add({
    name, clientId: clientId || null, features,
    createdBy: actor.uid, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()
  });
  await audit(actor, "developer_feature_template_created", ref.id, { name, clientId: clientId || null });
  return { id: ref.id };
});

exports.applyDeveloperFeatureTemplate = onCall(async (request) => {
  const actor = requireDeveloper(request);
  const templateId = clean(request.data?.templateId, 120);
  const clientId = clean(request.data?.clientId, 80);
  if (!templateId) throw new HttpsError("invalid-argument", "Template ID is required.");
  const template = await db.doc("developerFeatureTemplates/" + templateId).get();
  if (!template.exists) throw new HttpsError("not-found", "Template not found.");
  const data = template.data();
  const batch = db.batch();
  for (const [id, config] of Object.entries(data.features || {})) {
    featureById(id);
    const ref = db.doc("developerFeatureSettings/" + id);
    if (clientId) {
      const current = await ref.get();
      const overrides = { ...((current.data() || {}).clientOverrides || {}) };
      overrides[clientId] = { enabled: config.enabled !== false, visibility: config.visibility || "visible", roleAccess: config.roleAccess || {} };
      batch.set(ref, { clientOverrides: overrides, updatedBy: actor.uid, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    } else {
      batch.set(ref, { ...config, updatedBy: actor.uid, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
  }
  await batch.commit();
  await audit(actor, "developer_feature_template_applied", templateId, { clientId: clientId || null });
  return { success: true };
});

exports.copyDeveloperClientConfig = onCall(async (request) => {
  const actor = requireDeveloper(request);
  const sourceClientId = clean(request.data?.sourceClientId, 80);
  const targetClientId = clean(request.data?.targetClientId, 80);
  if (!/^[a-zA-Z0-9_-]+$/.test(sourceClientId) || !/^[a-zA-Z0-9_-]+$/.test(targetClientId) || sourceClientId === targetClientId) {
    throw new HttpsError("invalid-argument", "Choose two different valid client IDs.");
  }
  const snapshot = await db.collection("developerFeatureSettings").get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.clientOverrides?.[sourceClientId]) {
      batch.set(doc.ref, { clientOverrides: { [targetClientId]: data.clientOverrides[sourceClientId] }, updatedBy: actor.uid, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
  });
  await batch.commit();
  await audit(actor, "developer_client_configuration_copied", targetClientId, { sourceClientId });
  return { success: true };
});

exports.submitDeveloperFeatureRequest = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in is required.");
  await assertFeatureEnabled("client.requests", request.auth.token.role || "student", clean(request.data?.clientId, 80) || null);
  const globalSnap = await db.doc("developerSettings/global").get();
  if (globalSnap.exists && (globalSnap.get("readOnly") || globalSnap.get("emergencyMode"))) throw new HttpsError("failed-precondition", "Feature requests are paused by global safety controls.");
  const title = clean(request.data?.title, 100);
  const details = clean(request.data?.details, 1000);
  if (title.length < 3) throw new HttpsError("invalid-argument", "Request title is required.");
  const ref = await db.collection("developerFeatureRequests").add({
    title, details, clientId: clean(request.data?.clientId, 80) || null,
    requestedBy: request.auth.uid, requesterRole: request.auth.token.role || null,
    status: "pending", createdAt: FieldValue.serverTimestamp()
  });
  return { id: ref.id, status: "pending" };
});

exports.reviewDeveloperFeatureRequest = onCall(async (request) => {
  const actor = requireDeveloper(request);
  const id = clean(request.data?.requestId, 120);
  const decision = request.data?.decision;
  if (!id || !["approved", "rejected"].includes(decision)) throw new HttpsError("invalid-argument", "Invalid request decision.");
  const ref = db.doc("developerFeatureRequests/" + id);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.get("status") !== "pending") throw new HttpsError("failed-precondition", "Request is no longer pending.");
    tx.update(ref, { status: decision, reviewedBy: actor.uid, reviewedAt: FieldValue.serverTimestamp() });
  });
  await audit(actor, "developer_feature_request_" + decision, id);
  return { success: true };
});

exports.setDeveloperSystemControls = onCall(async (request) => {
  const actor = requireDeveloper(request);
  const input = request.data?.settings || {};
  const allowed = ["maintenance", "readOnly", "loginLockdown", "emergencyMode"];
  const patch = {};
  for (const key of allowed) if (typeof input[key] === "boolean") patch[key] = input[key];
  if (typeof input.maintenanceMessage === "string") patch.maintenanceMessage = clean(input.maintenanceMessage, 500);
  if (!Object.keys(patch).length) throw new HttpsError("invalid-argument", "No valid system controls provided.");
  await db.doc("developerSettings/global").set({ ...patch, updatedBy: actor.uid, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await audit(actor, "developer_global_controls_updated", "global", patch);
  return { success: true };
});

exports.createManagedAccount = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in is required.");
  const actor = request.auth;
  const actorRole = actor.token.role;
  const systemSnap = await db.doc("developerSettings/global").get();
  const systemSettings = systemSnap.exists ? systemSnap.data() : {};
  if (systemSettings.readOnly || systemSettings.emergencyMode) throw new HttpsError("failed-precondition", "Account creation is paused by global safety controls.");
  if (!["developer", "superAdmin"].includes(actorRole) || actor.token.accountStatus !== "active") {
    throw new HttpsError("permission-denied", "An active Developer or Administrator account is required.");
  }
  const role = clean(request.data?.role, 40);
  const allowedForDeveloper = ["student", "parent", "teacher", "assistant", "superAdmin"];
  const allowedForAdmin = ["student", "parent", "teacher", "assistant"];
  if (!(actorRole === "developer" ? allowedForDeveloper : allowedForAdmin).includes(role)) {
    throw new HttpsError("permission-denied", "Your role cannot create this account type.");
  }
  await assertFeatureEnabled("security.admin-accounts", actorRole);
  if (role === "superAdmin") await assertFeatureEnabled("security.create-admin", actorRole);
  const email = clean(request.data?.email, 254).toLowerCase();
  const displayName = clean(request.data?.displayName, 100);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || displayName.length < 2) {
    throw new HttpsError("invalid-argument", "Enter a valid email and a name with at least two characters.");
  }
  let user;
  try {
    user = await getAuth().createUser({ email, displayName, disabled: false, emailVerified: false });
    await getAuth().setCustomUserClaims(user.uid, { role, accountStatus: "active" });
    const passwordResetLink = await getAuth().generatePasswordResetLink(email);
    const batch = db.batch();
    const now = FieldValue.serverTimestamp();
    batch.set(db.doc("userProfiles/" + user.uid), {
      uid: user.uid, email, displayName, role, status: "active",
      provisionedBy: actor.uid, createdAt: now, updatedAt: now
    });
    batch.set(db.collection("auditEvents").doc(), {
      type: "managed_account_created", actorUid: actor.uid, actorRole,
      targetUid: user.uid, targetEmail: email, assignedRole: role, createdAt: now
    });
    await batch.commit();
    user.passwordResetLink = passwordResetLink;
  } catch (error) {
    if (user?.uid) await getAuth().deleteUser(user.uid).catch(() => {});
    if (error.code === "auth/email-already-exists") throw new HttpsError("already-exists", "An account with this email already exists.");
    throw error;
  }
  return { uid: user.uid, email, role, passwordResetLink: user.passwordResetLink };
});

exports.listManagedAccounts = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in is required.");
  const role = request.auth.token.role;
  if (!["developer", "superAdmin"].includes(role) || request.auth.token.accountStatus !== "active") {
    throw new HttpsError("permission-denied", "An active Developer or Administrator account is required.");
  }
  const page = await getAuth().listUsers(100);
  const users = page.users.filter((user) => {
    const targetRole = user.customClaims?.role || "unassigned";
    return role === "developer" || ["student", "parent", "teacher", "assistant"].includes(targetRole);
  }).map((user) => ({
    uid: user.uid, email: user.email || "", displayName: user.displayName || "",
    role: user.customClaims?.role || "unassigned", disabled: user.disabled
  }));
  return { users, nextPageToken: page.pageToken || null };
});

exports.setManagedAccountStatus = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in is required.");
  const actor = request.auth, actorRole = actor.token.role;
  if (!["developer", "superAdmin"].includes(actorRole) || actor.token.accountStatus !== "active") {
    throw new HttpsError("permission-denied", "An active Developer or Administrator account is required.");
  }
  const uid = clean(request.data?.uid, 128);
  const disabled = request.data?.disabled;
  if (!uid || uid === actor.uid || typeof disabled !== "boolean") {
    throw new HttpsError("invalid-argument", "Choose another account and a valid active/disabled state.");
  }
  const target = await getAuth().getUser(uid);
  const claims = target.customClaims || {};
  if (actorRole === "superAdmin" && !["student", "parent", "teacher", "assistant"].includes(claims.role)) {
    throw new HttpsError("permission-denied", "Administrators can manage educational accounts only.");
  }
  await getAuth().updateUser(uid, { disabled });
  await getAuth().setCustomUserClaims(uid, { ...claims, accountStatus: disabled ? "disabled" : "active" });
  await db.doc("userProfiles/" + uid).set({
    status: disabled ? "disabled" : "active", updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid
  }, { merge: true });
  await audit(actor, disabled ? "managed_account_deactivated" : "managed_account_reactivated", uid, { email: target.email || null, role: claims.role || null });
  return { success: true, disabled };
});

exports.getDeveloperUserStatistics = onCall(async (request) => {
  requireDeveloper(request);
  const counts = {};
  let pageToken;
  do {
    const page = await getAuth().listUsers(1000, pageToken);
    for (const user of page.users) {
      const role = user.customClaims?.role || "unassigned";
      counts[role] = (counts[role] || 0) + 1;
    }
    pageToken = page.pageToken;
  } while (pageToken);
  return { totalAccounts: Object.values(counts).reduce((sum, value) => sum + value, 0), byRole: counts };
});
