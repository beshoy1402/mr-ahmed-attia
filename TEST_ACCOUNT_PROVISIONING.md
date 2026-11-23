# Test account role provisioning

This is a one-time, trusted-admin script for the five test accounts used by the Mr. Ahmed Attia portal. It assigns Firebase Authentication custom claims and creates minimal user profile/audit records. It does not create Auth users or grant access to protected student data.

## Role mapping

| Email | Assigned role |
|---|---|
| student@gmail.com | student |
| parent@gmail.com | parent |
| teacher@gmail.com | teacher |
| assistant@gmail.com | assistant |
| admin@gmail.com | superAdmin |

The test teacher account is assigned the limited `teacher` role, not `mainTeacher`. The main teacher must be bootstrapped separately using the verified teacher-controlled account and the one-time bootstrap process in `FIREBASE_SETUP.md`. The administrator test account receives `superAdmin` and can review Student/Parent access requests.

## Requirements

- All five accounts already exist in Firebase Authentication.
- Verify each account's email address in Firebase Authentication before running.
- Run from a trusted local machine with Google Application Default Credentials for an identity authorized to administer Firebase Authentication and Firestore in project `mr-ahmed-attia-12345`.
- Do not download or commit service-account JSON keys. Use Application Default Credentials.

## Run

From the repository root:

```powershell
cd functions
npm install
gcloud auth application-default login
node .\\scripts\\provision-test-accounts.mjs
```

The first run is a dry run. Check every email, role, and UID printed. Only after confirming the mapping, apply it:

```powershell
node .\\scripts\\provision-test-accounts.mjs --apply
```

The script refuses a different Firebase project, missing/disabled/unverified accounts, conflicting existing roles, or a second completed run. It restores previously changed custom claims if the write process fails. After success, all five accounts must sign out and sign in again.

## Security boundary

- Roles are written only by the trusted Admin SDK script, never by browser input.
- Firestore and Storage rules remain deny-all.
- Dashboards are role-specific interface shells only. Course content, student records, parent-child links, payments, attendance, grades, and files remain unavailable until scoped rules and backend authorization are implemented and tested.
- Do not use the test accounts with real student data.
