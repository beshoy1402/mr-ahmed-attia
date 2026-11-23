# Firebase Project Connection Checklist

## Current security posture

The dedicated Firebase project is `mr-ahmed-attia-12345`. The web sign-in flow has been tested successfully. The repository now contains an initial Firebase Cloud Functions account-approval backend, but **those functions have not yet been deployed to Firebase**.

Firestore and Storage client rules remain deny-all. This is intentional: no browser can read student records or write privileged data until collection-specific rules and emulator tests are complete. Do not loosen these rules with broad authenticated-user access.

## 1. Confirm the correct project

1. Open the Firebase project intended specifically for **Mr. Ahmed Attia's SAT Reading & Writing LMS**.
2. Verify the project ID is exactly `mr-ahmed-attia-12345`.
3. Confirm project ownership, billing plan, region, and data location.
4. Keep development/staging separate from production; never use real student records in test environments.

## 2. Authentication and web app

- Email/Password sign-in is enabled and the deployed Vercel hostname must remain in Authentication → Settings → Authorized domains.
- The web configuration in `firebase-config.js` contains public client identifiers only. Never put Admin SDK credentials in frontend code.
- Verify teacher-controlled accounts by email before using them for the initial Main Teacher bootstrap.

## 3. Account approval backend (implemented, not deployed)

The `functions/` directory contains callable Cloud Functions:
- `requestAccountAccess`: verified users may request only Student or Parent access.
- `getMyAccountStatus`: returns the signed-in user's server-side status.
- `listPendingAccessRequests`: active Main Teacher/Super Admin only.
- `reviewAccessRequest`: approves or rejects Student/Parent requests; role claims are set by Firebase Admin SDK only.

The current test account is not automatically promoted. Do not assign it a role unless the project owner confirms it is the intended teacher account.

### Bootstrap the first Main Teacher

1. Create Mr. Ahmed's teacher-controlled user in Firebase Authentication.
2. Verify the email.
3. Copy that user's Firebase Auth UID from Authentication → Users.
4. On a trusted local machine, authenticate Application Default Credentials for an identity authorized to administer this Firebase project. Keep credentials outside the repository.
5. From the repository's `functions` directory run:

```powershell
npm install
$env:MAIN_TEACHER_UID = "PASTE_MR_AHMED_AUTH_UID"
$env:FIREBASE_PROJECT_ID = "mr-ahmed-attia-12345"
node .\scripts\bootstrap-main-teacher.mjs
```

The script uses a Firestore one-time bootstrap marker and refuses to replace a different Main Teacher. After a successful bootstrap, Mr. Ahmed must sign out and sign in again to refresh the Firebase ID token.

### Deploy Cloud Functions

From the repository root:

```powershell
npm install --global firebase-tools
firebase login
firebase use mr-ahmed-attia-12345
cd functions
npm install
cd ..
firebase deploy --only functions
```

Firebase Functions deployment may require the project to be on the Blaze plan and the relevant Google Cloud APIs enabled. Confirm any billing implications in Firebase Console before deployment. The Git/Vercel deployment does not deploy Firebase Cloud Functions.

## 4. Rules and emulator workflow

The current Firestore and Storage rules intentionally deny every client read/write. Keep them that way until scoped rules are implemented and tested.

Run the local emulators after installing Firebase CLI and Functions dependencies:

```powershell
firebase emulators:start --only auth,firestore,functions,storage
```

Required tests before opening data access:
- Unauthenticated and pending users cannot read protected records.
- Students can read only approved, enrolled, entitled, and released course content.
- Parents can read only explicitly linked and approved children.
- Teachers and assistants are limited to assigned courses, groups, and centers.
- Accountants and support staff receive only their authorized records.
- Developers cannot automatically read private student chats, grades, or financial records.
- Clients cannot grant themselves roles, publish AI content, finalize grades, or confirm payments.
- All privileged changes create audit records.

## 5. Current limits

- Approval functions support Student and Parent roles only.
- Parent approval does not create a parent-child relationship.
- Student approval does not create course enrollment or payment entitlement.
- No courses, grades, payments, messages, or student records are exposed by this milestone.
- The backend code must be deployed and emulator-tested before it is treated as active.

## 6. Before production use

Configure App Check, backups and restore tests, monitoring, alerting, retention policies, environment separation, and reviewed collection-specific Firestore/Storage rules. Do not import real student data until authorization and recovery have been verified.
