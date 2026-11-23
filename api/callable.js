import { createRequire } from "node:module";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
const require = createRequire(import.meta.url);
function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) { const error = new Error("Backend setup is incomplete. Add FIREBASE_SERVICE_ACCOUNT_JSON to Vercel environment variables."); error.statusCode = 503; throw error; }
  let serviceAccount;
  try { serviceAccount = JSON.parse(raw); } catch { const error = new Error("FIREBASE_SERVICE_ACCOUNT_JSON must contain valid service-account JSON."); error.statusCode = 503; throw error; }
  return initializeApp({ credential: cert(serviceAccount), projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id });
}
const statusForCode = (code) => ({ "unauthenticated":401, "permission-denied":403, "invalid-argument":400, "not-found":404, "already-exists":409, "failed-precondition":409, "resource-exhausted":429, "unavailable":503 }[code] || 500);
export default async function handler(req,res) {
  if (req.method !== "POST") { res.setHeader("Allow","POST"); return res.status(405).json({error:{code:"method-not-allowed",message:"Use POST."}}); }
  try {
    const match=(req.headers.authorization||"").match(/^Bearer\s+(.+)$/i);
    if(!match) return res.status(401).json({error:{code:"unauthenticated",message:"A valid sign-in session is required."}});
    const app=getAdminApp(), decoded=await getAuth(app).verifyIdToken(match[1],true);
    const body=typeof req.body==="string"?JSON.parse(req.body):(req.body||{}), name=typeof body.name==="string"?body.name:"";
    if(!/^[A-Za-z][A-Za-z0-9]{1,80}$/.test(name)) return res.status(400).json({error:{code:"invalid-argument",message:"Invalid operation name."}});
    const operation=require("../functions/core.cjs")[name];
    if(typeof operation!=="function") return res.status(404).json({error:{code:"not-found",message:"This operation is not available."}});
    const result=await operation({auth:{uid:decoded.uid,token:decoded},data:body.data&&typeof body.data==="object"?body.data:{}});
    return res.status(200).json({data:result??null});
  } catch(error) {
    const code=error.code||"internal", status=error.statusCode||statusForCode(code);
    if(status>=500) console.error("Vercel callable backend error:",error);
    return res.status(status).json({error:{code,message:status>=500&&code==="internal"?"The server could not complete this request.":(error.message||"Request failed.")}});
  }
}
