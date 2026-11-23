# Production Architecture

## Architecture principles

1. Firebase is the primary backend, subject to verification of the production Firebase project and billing/region configuration.
2. The browser is untrusted. All privileged operations are authorized and validated on trusted server code.
3. Every role uses the same identity foundation with explicit role grants and resource scopes.
4. Course/center/group membership is enforced in the data layer and server operations, not just in UI navigation.
5. AI retrieval is permission-filtered before context reaches a model.
6. Payment status is derived from verified server-side payment events, never from a client redirect.
7. Educational content and sensitive operational records have explicit ownership, retention, and audit policies.
8. External integrations are adapters with health status, retry strategy, and provider-specific capability checks.

## Proposed stack

- Web application: TypeScript with a React-based framework selected after auditing the current frontend and deployment constraints.
- Backend: Firebase Authentication, Cloud Firestore, Cloud Storage, Cloud Functions (or an approved trusted server runtime where justified), Firebase App Check, and Firebase Cloud Messaging.
- Validation: shared schemas at UI boundaries and trusted server boundaries.
- Testing: unit, integration, rules emulator, and browser end-to-end tests.
- Deployment: isolated development, staging, and production environments.
- Observability: structured server logs, error reporting, health checks, and operational alerts.

Do not perform a framework migration until the repository has been fully assessed and the migration benefit is documented.

## Application modules

- Public marketing website.
- Authentication and onboarding.
- Role-specific dashboards.
- Student learning workspace.
- Parent workspace.
- Teacher/assistant workspace.
- Center operations.
- Question bank and import pipeline.
- Exam delivery and grading.
- Homework and submissions.
- Attendance.
- Payments and entitlements.
- Messaging and notifications.
- AI orchestration and knowledge retrieval.
- Developer/operations control center.

## Firebase service responsibilities

### Authentication
Identity, verification, session lifecycle, and supported sign-in methods. Role claims are assigned only by trusted administrative workflows. Avoid treating client-editable profile fields as authorization claims.

### Firestore
Operational records, course structure, enrollment, question metadata, exam attempts, grade records, attendance, payment ledger metadata, conversations, notifications, configuration, and audit events.

Use query-oriented document design. Avoid unbounded arrays and oversized documents. Use immutable or append-only records for financial and audit history where appropriate.

### Storage
Private course files, submissions, question-import source files, generated reports, and permitted media. Paths must encode tenant/resource ownership and be checked by Storage rules and trusted server code. Use short-lived authorized access where appropriate.

### Cloud Functions / trusted server
Role and permission administration, enrollment decisions, exam issuance/submission, grading finalization, payment webhooks, protected file processing, AI requests, content approval, notification dispatch, and sensitive exports.

### App Check
Use where supported to reduce unauthorized client abuse. App Check supplements, but never replaces, authentication and authorization.

## Conceptual data domains

- Identity: users, profiles, roleGrants, parentStudentLinks, sessions.
- Organization: centers, rooms, staffAssignments.
- Learning: courses, groups, enrollments, units, lessons, lessonProgress.
- Assessment: questionBanks, passages, questions, imports, exams, attempts, answers, grading.
- Operations: homework, submissions, attendanceSessions, attendanceRecords.
- Commerce: products/packages, subscriptions, invoices, paymentEvents, entitlements, refunds.
- Communication: conversations, participants, messages, tickets, notifications.
- AI: providers (non-secret metadata), modelRoutes, knowledgeSources, retrievalPermissions, aiSessions, usage, contentReviews.
- Governance: auditEvents, systemSettings, backups, featureFlags, integrationHealth.

This is a conceptual map. Final collection paths, document shapes, indexes, and partitioning must be derived from real access patterns and security rules before implementation.

## Access control model

Use RBAC plus resource-scoped grants:
- Role: what actions a person may perform.
- Scope: which course, group, center, student, or record they may act on.
- Relationship: parent-child link, enrollment, assigned teacher, or staff assignment.
- State: account approval, enrollment status, payment entitlement, content publication state.

Sensitive server operations must evaluate all four dimensions.

## AI request flow

1. Authenticate user.
2. Resolve role and resource scope.
3. Check AI feature entitlement and usage limits.
4. Determine permitted course and user knowledge sources.
5. Retrieve only authorized material.
6. Rank approved materials above general sources.
7. Attach provenance metadata to retrieved context.
8. Route to configured provider/model.
9. Enforce output and safety policies.
10. Label official, teacher-authored, third-party, and AI-generated content accurately.
11. Disclose general-knowledge use when applicable.
12. Log minimal operational metadata and usage without unnecessarily retaining sensitive prompt content.
13. Escalate uncertainty to teacher when configured.

## Question import pipeline

Upload -> file validation -> secure storage -> extraction -> structure detection -> passage/question grouping -> answer-key parsing -> image handling -> duplicate check -> confidence/error report -> teacher review -> destination/taxonomy selection -> approval -> question-bank commit -> audit event.

No unverified answer key or explanation may be silently generated and stored as fact.

## Payment and entitlement flow

Create pending invoice/order -> initiate provider checkout -> receive signed webhook -> verify signature and transaction status server-side -> idempotently record payment event -> reconcile invoice -> calculate entitlement -> grant or adjust course access -> notify relevant users -> audit.

Never grant paid access based only on a browser success URL.

## Environments

Maintain separate development, staging, and production Firebase resources and Vercel environments. Never reuse production student records for test data. Production migrations require backup, review, and rollback planning.
