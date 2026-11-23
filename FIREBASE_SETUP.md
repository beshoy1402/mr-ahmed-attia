# Firebase Project Connection Checklist

## Important

This repository has Firebase configuration and **deny-by-default** rules templates. It is not connected to a Firebase project yet. No project ID, credentials, user data, or production database is assumed.

Do not deploy these rules to an existing Firebase project until its ownership and current rules have been checked. The current rules intentionally deny every Firestore and Storage request; they are a safe starting point, not a functioning application authorization policy.

## 1. Confirm the correct project

In the Firebase Console:
1. Open the project intended specifically for **Mr. Ahmed Attia's SAT Reading & Writing LMS**.
2. Confirm the project name and project ID.
3. Do not reuse another teacher's or another application’s Firebase project.
4. Confirm billing plan, region, data location, and project owners.
5. Create a separate development/staging project before testing real data.

## 2. Register the web application

1. In Project settings, register a Web App for this LMS.
2. Copy the web app configuration values into the hosting provider's environment-variable settings.
3. The Firebase web config is public app identification, not an admin credential. Security must come from Authentication, Firestore/Storage rules, App Check, and trusted server authorization.
4. Never commit real environment files or service-account keys.

Required public web values are listed in `.env.example`.

## 3. Enable only the services needed for the first milestone

- Authentication: enable the sign-in methods only after the account and verification flows are designed.
- Firestore: create the database in the approved region.
- Storage: enable only when secure file uploads are ready.
- App Check: configure for supported production clients.
- Cloud Functions or another trusted server runtime: use for privileged role changes, approvals, payment verification, protected AI calls, and other privileged operations.

Do not expose admin SDK credentials in frontend code.

## 4. Rules and emulator workflow

Install the Firebase CLI locally and authenticate with an account authorized for this project. Start with the local emulators and test rules before deploying anything.

Example commands:

```bash
npm install --global firebase-tools
firebase login
firebase emulators:start
```

Before deploying rules, write and run tests for:
- unauthenticated users are denied;
- pending users cannot read protected learning records;
- students can read only enrolled and released course content;
- parents can read only approved linked children;
- teachers/assistants are limited to assigned courses, groups, and centers;
- accountants and support staff receive only their authorized records;
- developers cannot automatically read private student conversations, grades, or financial records;
- clients cannot grant themselves roles, publish AI content, finalize protected grades, or confirm payments.

The current templates deny all access. Do not loosen them with broad authenticated-user access.

## 5. First backend milestone

Implement and test in this order:
1. Firebase initialization and environment validation.
2. Authentication and account lifecycle.
3. Server-managed role grants and resource scopes.
4. Firestore/Storage rules and automated rules tests.
5. Student approval and invitation workflows.
6. Course/group enrollment and access entitlements.
7. Audit events for privileged actions.

## 6. Before production use

- Confirm production project ownership and authorized administrators.
- Configure separate production secrets in Vercel.
- Verify rules and emulator tests in CI.
- Enable backups and test restore procedures.
- Configure monitoring, alerts, and App Check.
- Review privacy, retention, and data-processing settings.
- Never import real student data until access controls and recovery procedures have been verified.
