# Deployment and Environment Plan

## Current status

No matching Vercel project was found during the initial connected-account search. Firebase configuration and production credentials have not been verified. No production deployment is claimed by this document.

## Required environments

| Environment | Purpose | Data |
|---|---|---|
| Development | Local feature work and automated tests | Synthetic data only |
| Staging | End-to-end validation and owner acceptance | Synthetic or explicitly approved test data |
| Production | Real students and business operations | Real data, strict access controls |

Each environment must have isolated Firebase resources, storage buckets, secrets, webhook endpoints, and provider credentials.

## Deployment gates

Before a production release:
1. Confirm target Git repository, branch, Vercel project, and environment.
2. Verify required environment variables exist without printing secret values.
3. Run lint, type checks, unit tests, integration tests, and production build.
4. Run Firestore and Storage rules tests.
5. Verify authentication and role-scoped access.
6. Verify critical workflows in staging.
7. Back up production data before schema/rules migrations.
8. Review migration compatibility and rollback path.
9. Deploy the tested build.
10. Verify the actual production URL, health, logs, and critical flows.

Do not release a preview build as production without the required checks.

## Secrets

Configure secrets directly in Firebase/Vercel secret-management interfaces. Do not paste secrets into chat, commit them to Git, or include them in deployment logs.

## External services requiring owner setup

- Firebase project and billing/region decision.
- Vercel project and domain.
- Email and phone OTP delivery.
- Payment gateway merchant account and webhooks.
- AI provider credentials and budget.
- Zoom/Google/Microsoft OAuth and API permissions.
- WhatsApp/SMS provider.
- Video hosting/streaming provider if direct uploads require transcoding/CDN.

## Rollback and recovery

Document application rollback separately from database/data rollback. Database migrations must be backward-compatible where possible. Destructive changes require a verified backup and an approved recovery plan.
