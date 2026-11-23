# Mr. Ahmed Attia — SAT Reading & Writing LMS

A production-oriented Learning Management System for SAT Reading & Writing, designed for students, parents, teachers, assistants, administrators, education centers, support staff, accountants, and developers.

## Current repository state

- Existing public website: `index.html` (legacy static landing page).
- Production foundation branch: `production-foundation`.
- Backend: not yet connected. Firebase project ownership/configuration and environment values must be verified before enabling real authentication or data operations.
- Deployment: no matching Vercel project was found during the initial connected-account inspection.

## Product scope

The first release focuses on SAT Reading & Writing. SAT Math and additional subjects are future extensibility targets, not part of the initial active curriculum.

See:
- [Requirements register](./REQUIREMENTS.md)
- [Architecture](./ARCHITECTURE.md)
- [Security model](./SECURITY.md)
- [Deployment plan](./DEPLOYMENT.md)
- [Claude Code project instructions](./CLAUDE.md)

## Important production rule

Do not present static UI, mock data, local-only state, or placeholder integrations as working production functionality. A feature is production-ready only after its backend, permissions, validation, persistence, failure handling, and tests are implemented.

## Local development

The repository currently contains a static HTML landing page. Until the application framework and Firebase project are verified, preview it with any static web server. Do not add secrets to source control.

## Release status

This branch establishes the documented production baseline. It is not a claim that the complete LMS, Firebase backend, payment processing, AI providers, or third-party integrations are already live.
