# Mr. Ahmed Attia — SAT Reading & Writing LMS

A production-oriented Learning Management System for SAT Reading & Writing, designed for students, parents, teachers, assistants, administrators, education centers, support staff, accountants, and developers.

## Current release

- Public website: [Open the live site](https://mr-ahmed-attia-99m5mf8og-beshoys-projects-3aeeadba.vercel.app).
- Git branch: `production-foundation`.
- Public site: responsive SAT Reading & Writing landing page with English/Arabic language switching, SAT domain overview, practice information, FAQ, and mobile navigation.
- Student Portal: bilingual Firebase email/password sign-in, password reset, server-backed account status, Student/Parent access requests, and a teacher review interface.
- Firebase project: `mr-ahmed-attia-12345`.
- Backend: initial Firebase Cloud Functions source is committed under `functions/`; it has **not yet been deployed to Firebase**.
- Security: Firestore and Storage client rules remain deny-all. No student records, course content, or operational data are open to browser access.
- Vercel: the static website and portal can be deployed from the linked Git branch. Vercel deployment does not deploy Firebase Cloud Functions.

## Product scope

The first release focuses on SAT Reading & Writing. SAT Math and additional subjects are future extensibility targets, not part of the initial active curriculum.

See:
- [Requirements register](./REQUIREMENTS.md)
- [Architecture](./ARCHITECTURE.md)
- [Security model](./SECURITY.md)
- [Deployment plan](./DEPLOYMENT.md)
- [Firebase connection checklist](./FIREBASE_SETUP.md)
- [Logical data model](./docs/DATA_MODEL.md)
- [Release readiness checklist](./docs/RELEASE_CHECKLIST.md)
- [Claude Code project instructions](./CLAUDE.md)

## Important production rule

The current release is the public marketing website plus a limited authentication/account-approval interface. It is **not the complete LMS**. Do not present static UI, mock data, local-only state, or placeholder integrations as working production functionality. A feature is production-ready only after its backend, permissions, validation, persistence, failure handling, and tests are implemented.

## Local development

The public site remains static HTML/CSS/JavaScript. Firebase Cloud Functions use Node.js 20 and live in `functions/`. Install the Firebase CLI and Functions dependencies as described in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md). Never commit service-account keys, local environment files, or secrets.

## Release status

- [x] Production foundation branch created.
- [x] Product requirements, architecture, security, deployment, and Claude Code instructions documented.
- [x] Public SAT Reading & Writing website refreshed and deployed.
- [x] Firebase configuration scaffold and fail-closed Firestore/Storage rules added.
- [x] Firebase connection checklist and initial data model added.
- [x] Dedicated Firebase project ID pinned.
- [x] Supplied public Firebase Web App configuration and bilingual email/password sign-in portal connected.
- [x] Firebase email/password sign-in verified by the user.
- [x] Initial server-side Student/Parent request and approval functions implemented in source.
- [x] One-time Main Teacher bootstrap script added; it has not been run.
- [ ] Deploy Firebase Cloud Functions and verify callable functions in the Firebase project.
- [ ] Bootstrap Mr. Ahmed's verified account as Main Teacher.
- [ ] Add emulator-tested, resource-scoped Firestore/Storage rules.
- [ ] Implement approved parent-child links and student enrollment/entitlements.
- [ ] Courses, enrollments, question bank, and imports.
- [ ] Exams, grading, homework, attendance.
- [ ] AI tutor, teacher assistant, and knowledge retrieval.
- [ ] Payments, messaging, notifications, and integrations.
- [ ] Analytics, backups, and developer operations dashboard.
