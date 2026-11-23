import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { firebaseConfig } from "/firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const form = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const message = document.getElementById("message");
const loginArea = document.getElementById("loginArea");
const signedArea = document.getElementById("signedArea");
const signedText = document.getElementById("signedText");
const emailInput = document.getElementById("email");
let lang = "en";

const copy = {
  en: {
    signing: "Signing in…", signIn: "Sign in securely",
    errors: {
      "auth/invalid-email": "Enter a valid email address.",
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
    signedInfo: "Your identity is authenticated. Course access and student records remain unavailable until the teacher approval workflow and secure data permissions are activated.",
    signOut: "You have been signed out."
  },
  ar: {
    signing: "جارٍ تسجيل الدخول…", signIn: "تسجيل الدخول بأمان",
    errors: {
      "auth/invalid-email": "أدخل بريدًا إلكترونيًا صحيحًا.",
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
    signedInfo: "تم التحقق من هويتك. ستظل الدورات وسجلات الطلاب غير متاحة حتى يتم تفعيل موافقة المدرس وصلاحيات البيانات الآمنة.",
    signOut: "تم تسجيل الخروج."
  }
};

function showMessage(text, type = "error") {
  message.textContent = text;
  message.className = "message show " + type;
}
function authError(error) {
  return copy[lang].errors[error.code] || copy[lang].generic;
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

document.getElementById("signoutButton").addEventListener("click", async () => {
  await signOut(auth);
  showMessage(copy[lang].signOut, "success");
});

onAuthStateChanged(auth, user => {
  if (user) {
    loginArea.style.display = "none";
    signedArea.classList.add("show");
    signedText.textContent = copy[lang].signed + (user.email || "account") + ". " + copy[lang].signedInfo;
  } else {
    loginArea.style.display = "block";
    signedArea.classList.remove("show");
  }
});

function setLanguage(next) {
  lang = next;
  document.documentElement.lang = next;
  document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-en][data-ar]").forEach(el => { el.innerHTML = el.dataset[next]; });
  document.getElementById("lang").textContent = next === "en" ? "عربي" : "English";
  loginButton.textContent = copy[lang].signIn;
}
document.getElementById("lang").addEventListener("click", () => setLanguage(lang === "en" ? "ar" : "en"));
