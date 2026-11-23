# Mr. Ahmed Attia — SAT Reading & Writing LMS

A production-oriented Learning Management System for SAT Reading & Writing, designed for students, parents, teachers, assistants, administrators, education centers, support staff, accountants, and developers.

## Current release

- Public website: [Open the live site](https://mr-ahmed-attia-99m5mf8og-beshoys-projects-3aeeadba.vercel.app).
- Git branch: `production-foundation`.
- Public site: responsive SAT Reading & Writing landing page with English/Arabic language switching, SAT domain overview, practice information, FAQ, and mobile navigation.
- Backend: Firebase has not yet been connected or verified. Real student authentication, course data, payments, exams, and AI services are not live.
- Vercel: project `mr-ahmed-attia`; deployment verified as `READY` for the public landing page.
- No custom domain is attached yet.

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

The current live release is the public marketing website only. It is not the complete LMS. Do not present static UI, mock data, local-only state, or placeholder integrations as working production functionality. A feature is production-ready only after its backend, permissions, validation, persistence, failure handling, and tests are implemented.

## Local development

The current public page is a static HTML file. Do not add secrets to source control. Backend and application framework decisions must follow the documented architecture and be verified before implementation.

## Release status

- [x] Production foundation branch created.
- [x] Product requirements, architecture, security, deployment, and Claude Code instructions documented.
- [x] Public SAT Reading & Writing website refreshed and deployed.
- [x] Firebase configuration scaffold and fail-closed Firestore/Storage rules added.
- [x] Firebase connection checklist, initial data model, and release checklist added.
- [x] Confirm and pin the dedicated Firebase project ID (`mr-ahmed-attia-12345`) in Firebase CLI and environment scaffolding.
- [ ] Register the Firebase Web App, add its public config in Vercel, enable required services, and implement/test scoped rules.
- [ ] Firebase environments and backend.
- [ ] Authentication and role-scoped permissions.
- [ ] Courses, enrollments, question bank, and imports.
- [ ] Exams, grading, homework, attendance.
- [ ] AI tutor, teacher assistant, and knowledge retrieval.
- [ ] Payments, messaging, notifications, and integrations.
- [ ] Analytics, backups, and developer operations dashboard.
