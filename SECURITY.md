# Security and Privacy Baseline

## Security posture

This platform handles student identities, education records, parent relationships, private communications, and financial information. Apply least privilege and data minimization by default.

## Mandatory controls

- Firebase Authentication for identity; trusted server workflows for role assignment.
- RBAC plus course/group/center/student scope checks.
- Firestore Security Rules and Storage Security Rules with deny-by-default posture.
- Server-side validation for all privileged writes.
- Firebase App Check where appropriate.
- Rate limits and abuse protection for authentication, AI, uploads, messaging, and OTP endpoints.
- Secure secret management; no secrets in browser bundles, Git history, logs, or ordinary database documents.
- Signed and verified payment webhooks with idempotency.
- File type, size, content, and malware checks appropriate to the file pipeline.
- Audit events for role changes, grades, attendance corrections, payment adjustments, access grants/revocations, imports, content approvals, exports, and destructive actions.
- Re-authentication or second-factor confirmation for high-risk operations.
- Data retention and deletion workflows with documented legal/operational review.
- Secure backups and periodic restore tests.

## Privacy boundaries

- Parents see only explicitly linked and approved children.
- Teachers and assistants see only assigned students/courses/groups unless separately granted.
- Center managers are scoped to assigned centers.
- Accountants see only permitted financial records.
- Support staff see only assigned support data.
- Developers receive technical access only; no automatic access to private student conversations, grades, or financial records.
- AI retrieval must filter data before sending it to external providers.
- External AI providers must be selected only after reviewing data handling, retention, regional processing, and contractual settings.

## Sensitive actions

Require additional authorization and audit records for:
- Changing roles or permissions.
- Deleting or exporting sensitive records.
- Changing payment settings.
- Adjusting grades after publication.
- Changing attendance after lock.
- Granting/revoking protected content access.
- Changing AI providers or secret references.
- Disabling security controls.
- Restoring backups.

## Incident readiness

Maintain:
- Security event logs.
- Credential rotation procedures.
- Backup restoration procedures.
- Integration revocation procedures.
- Incident response owner and escalation process.
- Documented recovery objectives once business requirements are confirmed.

Never treat tab-switch events, similarity scores, or automated flags as proof of misconduct.
