import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { createCallable } from "./api-client.js";
import { firebaseConfig } from "/firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const call = createCallable(auth);
const form = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const message = document.getElementById("message");
const loginArea = document.getElementById("loginArea");
const signedArea = document.getElementById("signedArea");
const signedText = document.getElementById("signedText");
const emailInput = document.getElementById("email");
const accountStatus = document.getElementById("accountStatus");
const requestForm = document.getElementById("requestAccessForm");
const requestButton = document.getElementById("requestAccessButton");
const teacherPanel = document.getElementById("teacherPanel");
const featureRequestForm = document.getElementById("featureRequestForm");
const bugReportForm = document.getElementById("bugReportForm");
const bugReportButton = document.getElementById("bugReportButton");
const featureRequestButton = document.getElementById("featureRequestButton");
const pendingList = document.getElementById("pendingList");
const roleDashboard = document.getElementById("roleDashboard");
const dashboardTitle = document.getElementById("dashboardTitle");
const dashboardDescription = document.getElementById("dashboardDescription");
const dashboardModules = document.getElementById("dashboardModules");
const roleNav = document.getElementById("roleNav");
const roleDetail = document.getElementById("roleDetail");
const roleDetailTitle = document.getElementById("roleDetailTitle");
const roleDetailText = document.getElementById("roleDetailText");
const roleUserEmail = document.getElementById("roleUserEmail");
const roleLabel = document.getElementById("roleLabel");
const roleWelcomeTitle = document.getElementById("roleWelcomeTitle");
const roleWelcomeText = document.getElementById("roleWelcomeText");
const roleWelcomeKicker = document.getElementById("roleWelcomeKicker");
const roleModulesHeading = document.getElementById("roleModulesHeading");
const roleQuicklinks = document.getElementById("roleQuicklinks");
let lang = "en";
let currentUser = null;

const copy = {
  en: {
    signing: "Signing in…", signIn: "Sign in securely",
    errors: {
      "auth/invalid-email": "Enter a valid email address.",
      "auth/operation-not-allowed": "Email/password sign-in is not enabled in Firebase Authentication.",
      "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication settings.",
      "auth/invalid-api-key": "The Firebase web API key is invalid. Check the web app configuration.",
      "auth/user-disabled": "This account has been disabled. Contact your teacher.",
      "auth/user-not-found": "No account was found for this email.",
      "auth/wrong-password": "The password is incorrect.",
      "auth/invalid-credential": "The email or password is incorrect.",
      "auth/too-many-requests": "Too many attempts. Wait a little and try again.",
      "auth/network-request-failed": "Network error. Check your connection and try again."
    },
    generic: "We could not sign you in. Check your details and try again.",
    resetSent: "Password reset email sent. Check your inbox and spam folder.",
    resetNeedEmail: "Enter your email address first.",
    resetFailed: "We could not send the reset email. Check the address and try again.",
    signed: "Signed in as ",
    signedInfo: "Your identity is authenticated. Your permissions are determined separately by teacher approval.",
    signOut: "You have been signed out.",
    status: { unrequested:"No access request has been submitted. You can request student or parent access below.", pending:"Your access request is waiting for teacher review. Protected courses and records remain locked.", active:"Your account has been approved. Course access still depends on enrollment and any required payment.", rejected:"Your previous request was not approved. You may submit a new request if needed." },
    requestSent:"Your request was submitted. The teacher must review it before any learning access is enabled.",
    requestFailed:"We could not submit the request. Please try again.",
    loading:"Loading account status…", loadingRequests:"Loading pending requests…", noRequests:"There are no pending access requests.",
    requestTitle:"Request account access", name:"Your full name", role:"I am a", student:"Student", parent:"Parent", request:"Submit access request",
    teacherTitle:"Teacher review", approve:"Approve", reject:"Reject", reviewFailed:"Could not complete the review. Refresh and try again.",
    statusError:"Your sign-in worked, but the account-approval backend is not active yet. Protected data remains unavailable."
  },
  ar: {
    signing: "جارٍ تسجيل الدخول…", signIn: "تسجيل الدخول بأمان",
    errors: {
      "auth/invalid-email": "أدخل بريدًا إلكترونيًا صحيحًا.",
      "auth/operation-not-allowed": "تسجيل الدخول بالبريد وكلمة المرور غير مفعّل في Firebase Authentication.",
      "auth/unauthorized-domain": "نطاق هذا الموقع غير مضاف إلى النطاقات المسموح بها في Firebase Authentication.",
      "auth/invalid-api-key": "مفتاح Firebase غير صحيح. تحقق من إعدادات تطبيق الويب.",
      "auth/user-disabled": "تم تعطيل هذا الحساب. تواصل مع المدرس.",
      "auth/user-not-found": "لا يوجد حساب بهذا البريد الإلكتروني.",
      "auth/wrong-password": "كلمة المرور غير صحيحة.",
      "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      "auth/too-many-requests": "محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.",
      "auth/network-request-failed": "حدث خطأ في الاتصال. تحقق من الإنترنت وحاول مرة أخرى."
    },
    generic: "تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.",
    resetSent: "تم إرسال رسالة إعادة تعيين كلمة المرور. تحقق من البريد الوارد والرسائل غير المرغوب فيها.",
    resetNeedEmail: "أدخل بريدك الإلكتروني أولًا.",
    resetFailed: "تعذر إرسال رسالة إعادة التعيين. تحقق من البريد وحاول مرة أخرى.",
    signed: "تم تسجيل الدخول باسم ",
    signedInfo: "تم التحقق من هويتك. يتم تحديد الصلاحيات بشكل منفصل بعد موافقة المدرس.",
    signOut: "تم تسجيل الخروج.",
    status: { unrequested:"لم يتم إرسال طلب صلاحية. يمكنك طلب صلاحية طالب أو ولي أمر أدناه.", pending:"طلبك قيد مراجعة المدرس. تظل الدورات والسجلات المحمية مغلقة.", active:"تمت الموافقة على حسابك. يظل الوصول للدورات مرتبطًا بالتسجيل وأي مدفوعات مطلوبة.", rejected:"لم تتم الموافقة على طلبك السابق. يمكنك إرسال طلب جديد عند الحاجة." },
    requestSent:"تم إرسال طلبك. يجب على المدرس مراجعته قبل تفعيل أي صلاحية تعليمية.",
    requestFailed:"تعذر إرسال الطلب. حاول مرة أخرى.",
    loading:"جارٍ تحميل حالة الحساب…", loadingRequests:"جارٍ تحميل الطلبات المعلقة…", noRequests:"لا توجد طلبات صلاحية معلقة.",
    requestTitle:"طلب صلاحية حساب", name:"اسمك بالكامل", role:"أنا", student:"طالب", parent:"ولي أمر", request:"إرسال طلب الصلاحية",
    teacherTitle:"مراجعة المدرس", approve:"موافقة", reject:"رفض", reviewFailed:"تعذرت مراجعة الطلب. حدّث الصفحة وحاول مجددًا.",
    statusError:"تم تسجيل الدخول، لكن نظام موافقة الحساب لم يتم تفعيله بعد. تظل البيانات المحمية غير متاحة."
  }
};

function showMessage(text, type = "error") {
  message.textContent = text;
  message.className = "message show " + type;
}
function authError(error) {
  return copy[lang].errors[error.code] || copy[lang].generic;
}
function statusLabel(status) {
  return copy[lang].status[status] || copy[lang].status.unrequested;
}
function makeButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

const dashboards = {
  en: {
    student: { title: "Student Dashboard", description: "Your learning space for lessons, practice and progress.", modules: [["My courses","View enrolled learning programs."],["Lessons & resources","Continue approved lessons and study materials."],["Practice & exams","Work through skill practice and timed tests."],["Assignments","Review tasks and submit completed work."],["Grades & progress","Track released results and learning progress."],["Attendance","Review your recorded attendance."]] },
    parent: { title: "Parent Dashboard", description: "A family view of linked students and their learning activity.", modules: [["My children","Switch between children linked and approved by the teacher."],["Learning progress","Review each child's learning progress."],["Grades","View released grades for linked children."],["Attendance","Review attendance records."],["Homework","Follow assignments and completion."],["Payments & notices","Review authorized payment summaries and announcements."]] },
    teacher: { title: "Teacher Dashboard", description: "Teaching workspace for classes, learning content and assessments.", modules: [["Overview","Review teaching activity and class summaries."],["Students & classes","Manage assigned students and groups."],["Courses & lessons","Organize learning programs and lesson content."],["Question bank & exams","Prepare practice questions and assessments."],["Grades","Review and publish authorized results."],["Attendance & homework","Manage class attendance and assignments."]] },
    assistant: { title: "Assistant Dashboard", description: "A limited workspace for students and groups assigned to you.", modules: [["Assigned students","See only students assigned to your account."],["Attendance follow-up","Support attendance tracking for assigned groups."],["Homework follow-up","Track completion and follow-up tasks."],["Class support","View permitted class schedules and notices."]] },
    superAdmin: { title: "Administrator Dashboard", description: "System administration and access oversight.", modules: [["User accounts","Review account status and role assignments."],["Access requests","Review pending Student and Parent access requests."],["Staff & permissions","Manage staff access through trusted workflows."],["Reports","View approved system and operational summaries."],["Audit history","Review security and administrative events."],["System settings","Manage approved platform configuration."]] }
  },
  ar: {
    student: { title: "لوحة الطالب", description: "مساحتك التعليمية للدروس والتدريب ومتابعة التقدم.", modules: [["دوراتي","عرض البرامج التعليمية المسجل بها."],["الدروس والمصادر","متابعة الدروس والمواد المعتمدة."],["التدريب والاختبارات","التدريب على المهارات والاختبارات المحددة بوقت."],["الواجبات","مراجعة المهام وتسليم الأعمال."],["الدرجات والتقدم","متابعة النتائج المنشورة والتقدم."],["الحضور","مراجعة سجل الحضور."]] },
    parent: { title: "لوحة ولي الأمر", description: "متابعة الطلاب المرتبطين بحسابك والمعتمدين من المدرس.", modules: [["أبنائي","التنقل بين الأبناء المرتبطين والمعتمدين فقط."],["التقدم التعليمي","متابعة تقدم كل طالب."],["الدرجات","عرض الدرجات المنشورة للأبناء المرتبطين."],["الحضور","مراجعة سجلات الحضور."],["الواجبات","متابعة الواجبات وحالة الإنجاز."],["المدفوعات والإعلانات","مراجعة الملخصات والإعلانات المصرح بها."]] },
    teacher: { title: "لوحة المدرس", description: "مساحة لإدارة الفصول والمحتوى والتقييمات.", modules: [["نظرة عامة","متابعة نشاط التدريس وملخصات الفصول."],["الطلاب والفصول","إدارة الطلاب والمجموعات المسندة."],["الدورات والدروس","تنظيم البرامج والمحتوى التعليمي."],["بنك الأسئلة والاختبارات","إعداد الأسئلة والتقييمات التدريبية."],["الدرجات","مراجعة النتائج المصرح بها ونشرها."],["الحضور والواجبات","إدارة الحضور والمهام."]] },
    assistant: { title: "لوحة المساعد", description: "مساحة محدودة للطلاب والمجموعات المسندة إليك.", modules: [["الطلاب المسندون","عرض الطلاب المسندين إلى حسابك فقط."],["متابعة الحضور","دعم تسجيل الحضور للمجموعات المسندة."],["متابعة الواجبات","متابعة الإنجاز والمهام."],["دعم الفصول","عرض الجداول والإعلانات المصرح بها."]] },
    superAdmin: { title: "لوحة المسؤول", description: "إدارة النظام ومراجعة صلاحيات الوصول.", modules: [["حسابات المستخدمين","مراجعة حالة الحسابات وتعيين الأدوار."],["طلبات الوصول","مراجعة طلبات الطلاب وأولياء الأمور."],["الفريق والصلاحيات","إدارة صلاحيات الفريق عبر إجراءات موثوقة."],["التقارير","عرض الملخصات المصرح بها."],["سجل التدقيق","مراجعة الأحداث الأمنية والإدارية."],["إعدادات النظام","إدارة إعدادات المنصة المعتمدة."]] }
  }
};

function renderDashboard(role) {
  const config = dashboards[lang][role];
  if (!config) { roleDashboard.hidden = true; return; }
  const roleNames = {
    en: {student:"STUDENT SPACE",parent:"PARENT SPACE",teacher:"TEACHER WORKSPACE",assistant:"ASSISTANT WORKSPACE",superAdmin:"ADMINISTRATION"},
    ar: {student:"مساحة الطالب",parent:"مساحة ولي الأمر",teacher:"مساحة المدرس",assistant:"مساحة المساعد",superAdmin:"إدارة المنصة"}
  };
  const welcome = {
    en: {
      student:["Ready to keep learning?","Your courses, practice and learning updates will be organized here."],
      parent:["Stay connected to their learning.","A clear place for approved updates about linked children."],
      teacher:["Your teaching workspace starts here.","Keep your classes, learning resources and assessment tools organized."],
      assistant:["Your class support workspace.","Find your assigned support areas and follow-up sections here."],
      superAdmin:["Platform administration, made clearer.","Manage approved account and platform workflows from one organized workspace."]
    },
    ar: {
      student:["مستعد لمواصلة التعلم؟","ستجد هنا تنظيمًا لدوراتك وتدريباتك وتحديثاتك التعليمية."],
      parent:["تابع رحلتهم التعليمية بسهولة.","مساحة واضحة لمتابعة التحديثات المعتمدة للأبناء المرتبطين بحسابك."],
      teacher:["مساحة عملك التعليمية تبدأ من هنا.","نظّم الفصول والمصادر التعليمية وأدوات التقييم في مكان واحد."],
      assistant:["مساحة دعم الفصول الخاصة بك.","اعثر هنا على أقسام المتابعة والدعم المسندة إلى حسابك."],
      superAdmin:["إدارة المنصة بصورة أكثر وضوحًا.","أدر الحسابات وسير العمل المعتمد من مساحة منظمة."]
    }
  };
  dashboardTitle.textContent = config.title;
  dashboardDescription.textContent = config.description;
  roleLabel.textContent = roleNames[lang][role] || "LEARNING PORTAL";
  roleUserEmail.textContent = currentUser?.email || auth.currentUser?.email || (lang === "ar" ? "حسابك" : "Your account");
  roleWelcomeTitle.textContent = welcome[lang][role][0];
  roleWelcomeText.textContent = welcome[lang][role][1];
  roleWelcomeKicker.textContent = lang === "ar" ? "مرحبًا بك في مساحة عملك" : "WELCOME TO YOUR WORKSPACE";
  roleModulesHeading.textContent = lang === "ar" ? "أقسام مساحة العمل" : "Your workspace";
  dashboardModules.replaceChildren();
  roleNav.replaceChildren();
  const showModule = (index) => {
    const item = config.modules[index];
    if (!item) return;
    roleNav.querySelectorAll("button").forEach((button,i)=>button.classList.toggle("active",i===index));
    roleDetailTitle.textContent = item[0];
    roleDetailText.textContent = lang === "ar"
      ? "هذا القسم مُجهّز ضمن تصميم لوحة التحكم، لكن وظائفه وبياناته لن تُفتح قبل تنفيذ الصلاحيات الآمنة واختبارها."
      : "This section is included in the dashboard design. Its tools and data will remain unavailable until the required secure permissions are implemented and tested.";
    roleDetail.hidden = false;
  };
  config.modules.forEach(([title, description], index) => {
    const navButton = document.createElement("button");
    navButton.type = "button";
    navButton.textContent = title;
    navButton.addEventListener("click",()=>showModule(index));
    roleNav.append(navButton);
    const tile = document.createElement("article");
    tile.className = "dashboard-tile";
    const heading = document.createElement("strong");
    heading.textContent = title;
    const detail = document.createElement("span");
    detail.textContent = description;
    const lock = document.createElement("div");
    lock.className = "dashboard-lock";
    lock.textContent = lang === "ar" ? "غير مفعّل بعد" : "NOT ENABLED YET";
    tile.append(heading,detail,lock);
    dashboardModules.append(tile);
  });
  roleQuicklinks.replaceChildren();
  if (role === "superAdmin") {
    const link = document.createElement("a");
    link.href = "/admin-accounts.html";
    link.textContent = lang === "ar" ? "إدارة الحسابات التعليمية" : "Open account management";
    roleQuicklinks.append(link);
  }
  showModule(0);
  roleDashboard.hidden = false;
}
async function refreshAccount(user) {
  currentUser = user;
  accountStatus.textContent = copy[lang].loading;
  requestForm.hidden = true;
  teacherPanel.hidden = true;
  featureRequestForm.hidden = true;
  bugReportForm.hidden = true;
  roleDashboard.hidden = true;
  try {
    const result = await call("getMyAccountStatus")();
    const data = result.data;
    accountStatus.textContent = statusLabel(data.status) + (data.platformControls?.maintenance ? "\n\n" + (data.platformControls.maintenanceMessage || "The platform is undergoing scheduled maintenance.") : "");
    if (data.status === "active" && data.role) { renderDashboard(data.role); featureRequestForm.hidden = data.role === "developer"; bugReportForm.hidden = data.role === "developer"; }
    requestForm.hidden = !["unrequested", "rejected"].includes(data.status);
    if (data.canReviewRequests) {
      teacherPanel.hidden = false;
      await loadPendingRequests();
    }
  } catch (error) {
    accountStatus.textContent = copy[lang].statusError;
    console.error("Account status lookup failed:", error);
    if (error.code === "functions/permission-denied" && String(error.message || "").includes("temporarily restricted")) {
      await signOut(auth);
      showMessage("Portal access is temporarily restricted by the Developer.", "error");
    }
  }
}

async function loadPendingRequests() {
  pendingList.replaceChildren();
  const loading = document.createElement("p");
  loading.textContent = copy[lang].loadingRequests;
  pendingList.append(loading);
  try {
    const result = await call("listPendingAccessRequests")();
    pendingList.replaceChildren();
    const requests = result.data.requests || [];
    if (!requests.length) {
      const empty = document.createElement("p");
      empty.textContent = copy[lang].noRequests;
      pendingList.append(empty);
      return;
    }
    for (const item of requests) {
      const card = document.createElement("article");
      card.className = "request-card";
      const details = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = item.displayName || item.email || item.uid;
      const meta = document.createElement("p");
      meta.textContent = `${item.email || "No email"} · ${item.requestedRole}`;
      details.append(title, meta);
      const actions = document.createElement("div");
      actions.className = "request-actions";
      actions.append(
        makeButton(copy[lang].approve, "approve-button", () => reviewRequest(item.uid, "approve")),
        makeButton(copy[lang].reject, "reject-button", () => reviewRequest(item.uid, "reject"))
      );
      card.append(details, actions);
      pendingList.append(card);
    }
  } catch (error) {
    pendingList.replaceChildren();
    const failed = document.createElement("p");
    failed.textContent = copy[lang].reviewFailed;
    pendingList.append(failed);
    console.error("Pending request lookup failed:", error);
  }
}

async function reviewRequest(uid, decision) {
  try {
    await call("reviewAccessRequest")({ uid, decision });
    showMessage(decision === "approve" ? "Access request approved." : "Access request rejected.", "success");
    await loadPendingRequests();
  } catch (error) {
    console.error("Access review failed:", error);
    showMessage(copy[lang].reviewFailed);
  }
}

await setPersistence(auth, browserLocalPersistence);

form.addEventListener("submit", async event => {
  event.preventDefault();
  message.className = "message";
  loginButton.disabled = true;
  loginButton.textContent = copy[lang].signing;
  try {
    await signInWithEmailAndPassword(auth, emailInput.value.trim(), document.getElementById("password").value);
  } catch (error) {
    showMessage(authError(error));
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = copy[lang].signIn;
  }
});

document.getElementById("resetButton").addEventListener("click", async () => {
  const email = emailInput.value.trim();
  if (!email) { showMessage(copy[lang].resetNeedEmail); emailInput.focus(); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    showMessage(copy[lang].resetSent, "success");
  } catch (error) {
    showMessage(copy[lang].resetFailed);
  }
});

bugReportForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!currentUser) return;
  bugReportButton.disabled = true;
  try {
    await call("submitDeveloperBugReport")({
      title: document.getElementById("bugTitle").value.trim(),
      details: document.getElementById("bugDetails").value.trim(),
      severity: document.getElementById("bugSeverity").value
    });
    showMessage("Your bug report was submitted.", "success");
    bugReportForm.reset();
  } catch (error) {
    showMessage(error.message || "Could not submit the bug report.");
  } finally {
    bugReportButton.disabled = false;
  }
});

featureRequestForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!currentUser) return;
  featureRequestButton.disabled = true;
  try {
    await call("submitDeveloperFeatureRequest")({
      title: document.getElementById("featureRequestTitle").value.trim(),
      details: document.getElementById("featureRequestDetails").value.trim(),
      clientId: document.getElementById("featureRequestClient").value.trim()
    });
    showMessage("Your feature request was sent to the Developer for review.", "success");
    featureRequestForm.reset();
  } catch (error) {
    showMessage(error.message || "Could not submit the feature request.");
  } finally {
    featureRequestButton.disabled = false;
  }
});

requestForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!currentUser) return;
  requestButton.disabled = true;
  try {
    await call("requestAccountAccess")({
      displayName: document.getElementById("requestName").value.trim(),
      requestedRole: document.getElementById("requestedRole").value
    });
    showMessage(copy[lang].requestSent, "success");
    await refreshAccount(currentUser);
  } catch (error) {
    showMessage(error.message || copy[lang].requestFailed);
  } finally {
    requestButton.disabled = false;
  }
});

document.getElementById("signoutButton").addEventListener("click", async () => {
  await signOut(auth);
  showMessage(copy[lang].signOut, "success");
});

onAuthStateChanged(auth, async user => {
  if (user) {
    const token = await user.getIdTokenResult(true);
    await call("recordAuthenticatedLogin")({ userAgent: navigator.userAgent });
    if (token.claims.role === "developer" && token.claims.accountStatus === "active") {
      window.location.replace("/developer.html");
      return;
    }
    currentUser = user;
    loginArea.style.display = "none";
    signedArea.classList.add("show");
    signedText.textContent = copy[lang].signed + (user.email || "account") + ". " + copy[lang].signedInfo;
    await refreshAccount(user);
  } else {
    currentUser = null;
    loginArea.style.display = "block";
    signedArea.classList.remove("show");
    requestForm.hidden = true;
    teacherPanel.hidden = true;
    featureRequestForm.hidden = true;
    bugReportForm.hidden = true;
  }
});

function setLanguage(next) {
  lang = next;
  document.documentElement.lang = next;
  document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-en][data-ar]").forEach(el => { el.innerHTML = el.dataset[next]; });
  document.getElementById("lang").textContent = next === "en" ? "عربي" : "English";
  loginButton.textContent = copy[lang].signIn;
  if (currentUser) refreshAccount(currentUser);
}
document.getElementById("lang").addEventListener("click", () => setLanguage(lang === "en" ? "ar" : "en"));
