const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { randomUUID } = require("node:crypto");
class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
const onCall = (handler) => handler;
const db = getFirestore();

const TYPES = {
  classes: { label: "Class", fields: ["name", "subject", "level", "schedule", "room", "description", "status"], required: ["name"] },
  students: { label: "Student", fields: ["displayName", "email", "phone", "classId", "parentName", "parentEmail", "notes", "status"], required: ["displayName"] },
  courses: { label: "Course", fields: ["title", "subject", "description", "level", "status"], required: ["title"] },
  lessons: { label: "Lesson", fields: ["title", "courseId", "unit", "content", "resourceUrl", "durationMinutes", "status"], required: ["title", "courseId"] },
  questions: { label: "Question", fields: ["prompt", "passage", "options", "correctAnswer", "explanation", "domain", "skill", "difficulty", "status"], required: ["prompt"] },
  exams: { label: "Exam", fields: ["title", "classId", "courseId", "description", "durationMinutes", "startsAt", "endsAt", "status"], required: ["title"] },
  grades: { label: "Grade", fields: ["studentId", "examId", "score", "maxScore", "feedback", "published"], required: ["studentId", "score", "maxScore"] },
  attendance: { label: "Attendance record", fields: ["studentId", "classId", "date", "status", "notes"], required: ["studentId", "date", "status"] },
  homework: { label: "Homework", fields: ["title", "classId", "courseId", "description", "dueAt", "status"], required: ["title"] },
  groups: { label: "Group", fields: ["name", "classId", "description", "status"], required: ["name"] },
  schedules: { label: "Schedule", fields: ["title", "classId", "startsAt", "endsAt", "room", "meetingUrl", "status"], required: ["title", "startsAt", "endsAt"] }
};

function requireTeacher(request) {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in is required.");
  const { role, accountStatus } = request.auth.token;
  if (!["teacher", "mainTeacher", "additionalTeacher", "superAdmin"].includes(role) || accountStatus !== "active") {
    throw new HttpsError("permission-denied", "An active teacher account is required.");
  }
  return request.auth;
}
function clean(value, max = 3000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}
function validateFields(type, input) {
  const schema = TYPES[type];
  if (!schema) throw new HttpsError("invalid-argument", "Unknown teacher workspace section.");
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new HttpsError("invalid-argument", "Enter valid record details.");
  const fields = {};
  for (const key of schema.fields) {
    if (!(key in input)) continue;
    const value = input[key];
    if (typeof value === "string") fields[key] = clean(value, key === "content" || key === "passage" || key === "description" || key === "explanation" || key === "feedback" || key === "notes" ? 12000 : 1000);
    else if (typeof value === "number" && Number.isFinite(value)) fields[key] = value;
    else if (typeof value === "boolean") fields[key] = value;
    else if (Array.isArray(value) && key === "options") fields[key] = value.slice(0, 8).map((v) => clean(v, 1000));
    else if (value === null) fields[key] = null;
    else throw new HttpsError("invalid-argument", "Invalid value for " + key + ".");
  }
  for (const key of schema.required) if (fields[key] === undefined || fields[key] === "") throw new HttpsError("invalid-argument", schema.label + " requires " + key + ".");
  if (fields.status && type !== "attendance" && !["draft", "active", "published", "archived"].includes(fields.status)) throw new HttpsError("invalid-argument", "Choose a valid record status.");
  if (type === "grades" && (fields.score < 0 || fields.maxScore <= 0 || fields.score > fields.maxScore)) throw new HttpsError("invalid-argument", "Grade score must be between zero and the maximum score.");
  if (["durationMinutes"].some((key) => fields[key] !== undefined && fields[key] !== null && fields[key] <= 0)) throw new HttpsError("invalid-argument", "Duration must be greater than zero.");
  for (const key of ["startsAt", "endsAt", "dueAt", "date"]) if (fields[key] && Number.isNaN(Date.parse(fields[key]))) throw new HttpsError("invalid-argument", "Enter a valid date for " + key + ".");
  if (fields.startsAt && fields.endsAt && Date.parse(fields.endsAt) <= Date.parse(fields.startsAt)) throw new HttpsError("invalid-argument", "End time must be after start time.");
  for (const key of ["resourceUrl", "meetingUrl"]) if (fields[key]) { let url; try { url = new URL(fields[key]); } catch { throw new HttpsError("invalid-argument", "Enter a valid URL."); } if (!["https:", "http:"].includes(url.protocol)) throw new HttpsError("invalid-argument", "Only HTTP or HTTPS links are allowed."); }
  if (type === "attendance" && !["present", "absent", "late", "excused"].includes(fields.status)) throw new HttpsError("invalid-argument", "Choose a valid attendance status.");
  if (type === "students" && fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) throw new HttpsError("invalid-argument", "Enter a valid student email.");
  return fields;
}
async function assertTeacherWritesEnabled() {
  const snap = await db.doc("developerSettings/global").get();
  const settings = snap.exists ? snap.data() : {};
  if (settings.readOnly) throw new HttpsError("failed-precondition", "The platform is currently in read-only mode.");
  if (settings.emergencyMode) throw new HttpsError("unavailable", "The platform is temporarily in emergency mode.");
}
async function assertOwnedReference(actor, type, id) {
  if (!id) return;
  if (!TYPES[type]) throw new HttpsError("invalid-argument", "Invalid linked record type.");
  const ref = db.doc("teacherResources/" + type + "_" + clean(id, 100));
  const snap = await ref.get();
  if (!snap.exists || (snap.get("ownerUid") !== actor.uid && actor.token.role !== "superAdmin")) {
    throw new HttpsError("failed-precondition", "A linked record was not found in your workspace.");
  }
}
async function writeAudit(actor, action, type, id) {
  await db.collection("auditEvents").add({
    type: "teacher_" + action, actorUid: actor.uid, actorEmail: actor.token.email || null,
    actorRole: actor.token.role, resourceType: type, resourceId: id,
    createdAt: FieldValue.serverTimestamp()
  });
}

exports.getTeacherWorkspace = onCall(async (request) => {
  const actor = requireTeacher(request);
  const snapshot = await db.collection("teacherResources").where("ownerUid", "==", actor.uid).limit(500).get();
  const records = snapshot.docs.map((doc) => {
    const data = doc.data();
    return { id: doc.id.slice(doc.id.indexOf("_") + 1), type: data.type, ...data.fields, status: data.status || data.fields?.status || "active", updatedAt: data.updatedAt?.toDate?.().toISOString?.() || null };
  });
  const counts = Object.fromEntries(Object.keys(TYPES).map((type) => [type, records.filter((item) => item.type === type && item.status !== "archived").length]));
  return { records: records.filter((item) => item.status !== "archived"), counts, sections: Object.fromEntries(Object.entries(TYPES).map(([key, value]) => [key, value.label])) };
});

exports.saveTeacherResource = onCall(async (request) => {
  const actor = requireTeacher(request);
  await assertTeacherWritesEnabled();
  const type = clean(request.data?.type, 40);
  const id = clean(request.data?.id, 100) || randomUUID();
  if (!TYPES[type] || !/^[A-Za-z0-9_-]{8,100}$/.test(id)) throw new HttpsError("invalid-argument", "Invalid record type or ID.");
  const fields = validateFields(type, request.data?.fields);
  const references = { classId: "classes", courseId: "courses", studentId: "students", examId: "exams" };
  for (const [field, targetType] of Object.entries(references)) if (fields[field]) await assertOwnedReference(actor, targetType, fields[field]);
  const ref = db.doc("teacherResources/" + type + "_" + id);
  const current = await ref.get();
  if (current.exists && current.get("ownerUid") !== actor.uid && actor.token.role !== "superAdmin") {
    throw new HttpsError("permission-denied", "You cannot edit this record.");
  }
  const now = FieldValue.serverTimestamp();
  await ref.set({
    type, ownerUid: current.exists ? current.get("ownerUid") : actor.uid,
    fields: { ...(current.exists ? current.get("fields") || {} : {}), ...fields },
    status: fields.status || (current.exists ? current.get("status") : "active") || "active",
    createdBy: current.exists ? current.get("createdBy") : actor.uid,
    createdAt: current.exists ? current.get("createdAt") : now,
    updatedBy: actor.uid, updatedAt: now
  }, { merge: true });
  await writeAudit(actor, current.exists ? "resource_updated" : "resource_created", type, id);
  return { id, type, saved: true };
});

exports.archiveTeacherResource = onCall(async (request) => {
  const actor = requireTeacher(request);
  await assertTeacherWritesEnabled();
  const type = clean(request.data?.type, 40), id = clean(request.data?.id, 100);
  if (!TYPES[type] || !/^[A-Za-z0-9_-]{8,100}$/.test(id)) throw new HttpsError("invalid-argument", "Invalid record.");
  const ref = db.doc("teacherResources/" + type + "_" + id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Record not found.");
  if (snap.get("ownerUid") !== actor.uid && actor.token.role !== "superAdmin") throw new HttpsError("permission-denied", "You cannot archive this record.");
  await ref.update({ status: "archived", archivedBy: actor.uid, archivedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  await writeAudit(actor, "resource_archived", type, id);
  return { archived: true };
});
