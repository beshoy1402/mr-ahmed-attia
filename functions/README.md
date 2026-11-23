# Firebase account approval functions

These callable Cloud Functions implement the first trusted account-lifecycle milestone.

## Functions

- `requestAccountAccess`: authenticated users can request only `student` or `parent`; the client cannot choose a granted role or status.
- `getMyAccountStatus`: returns the caller's server-stored account status.
- `listPendingAccessRequests`: active Main Teacher/Super Admin only.
- `reviewAccessRequest`: active Main Teacher/Super Admin can approve/reject student and parent requests. Approval sets Firebase custom claims server-side and records an audit event.

The Firestore and Storage client rules intentionally remain deny-all. Admin SDK operations in these functions bypass Firestore rules; browser clients do not.

## Bootstrap the first Main Teacher

1. Create Mr. Ahmed's account in Firebase Authentication using a teacher-controlled email.
2. Verify that email.
3. Find the account UID in Authentication → Users.
4. From a trusted local machine, authenticate the Firebase Admin SDK with Application Default Credentials for an identity authorized to administer this Firebase project.
5. In the repository's `functions` directory, install dependencies and run:

```powershell
npm install
$env:MAIN_TEACHER_UID = "PASTE_THE_TEACHER_UID"
$env:FIREBASE_PROJECT_ID = "mr-ahmed-attia-12345"
node .\scripts\bootstrap-main-teacher.mjs
```

Do not use the current test account unless the project owner explicitly confirms it belongs to Mr. Ahmed. The script refuses to replace a different bootstrapped Main Teacher. Never commit service-account JSON or private keys.

After a role claim is assigned, the teacher must sign out and sign in again so Firebase refreshes the ID token.

## Deploy

From the repository root, after reviewing the target project and installing Firebase CLI:

```powershell
firebase use mr-ahmed-attia-12345
cd functions
npm install
cd ..
firebase deploy --only functions
```

Deploying functions requires an eligible Firebase/Google Cloud project, billing and API setup as required by Firebase. This repository commit alone does not deploy Cloud Functions.

## Current limits

- Student/parent approval does not create enrollments or parent-child links.
- No teacher/staff self-promotion or staff role assignment is exposed.
- No course, grade, payment, message, or student-record access is granted by this milestone.
- Parent accounts remain unable to see a child until a separate approved relationship workflow exists.
- Firestore/Storage remain deny-all until collection-specific rules and emulator tests are completed.
